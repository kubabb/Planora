// PlanoraAgent — main agent loop (think → act → observe)
// Uses AiClient for LLM calls, manages sessions and tools.

import type { AiClient, AiResponse, AiToolCall } from '@planora/core';
import { AgentSession } from './session';
import type { AgentConfig } from './config';
import { DEFAULT_AGENT_CONFIG } from './config';
import { getTool, getToolSchemas } from './tools/index';
import type { AgentRun, AgentRunStatus } from '@planora/core';
import { generateId } from './utils';

export interface WorkflowInput {
  projectName: string;
  projectDescription: string;
  stack: string[];
  outputDir: string;
}

export interface WorkflowOutput {
  runId: string;
  status: AgentRunStatus;
  files: string[];
  output: string;
  stepsUsed: number;
  tokensUsed: number;
  error?: string;
}

export class PlanoraAgent {
  constructor(
    private client: AiClient,
    private config: AgentConfig = DEFAULT_AGENT_CONFIG,
  ) {}

  /**
   * Run the plan workflow — generate project plan files.
   */
  async plan(
    workflow: WorkflowInput,
    systemPrompt: string,
  ): Promise<WorkflowOutput> {
    const runId = generateId();
    const session = new AgentSession(workflow.projectName, runId, this.config);

    // Build initial messages
    session.addSystem(systemPrompt);
    session.addUser(this.buildUserPrompt(workflow));

    let stepCount = 0;
    const tools = getToolSchemas();

    try {
      while (stepCount < this.config.maxSteps) {
        stepCount++;

        // 1. Think — send context to AI
        const response = tools.length > 0
          ? await this.client.generateWithTools(
              session.getContextWindow(),
              tools,
            )
          : await this.client.generate(session.getContextWindow());

        // 2. Process response
        if (response.content) {
          session.addAssistant(response.content, response.toolCalls);
        }
        session.tokensUsed += response.usage?.totalTokens ?? 0;

        // 3. Act — execute tool calls if any
        if (response.toolCalls?.length) {
          for (const call of response.toolCalls) {
            const tool = getTool(call.function.name);
            if (!tool) {
              session.addToolResult(call.id, `Nieznane narzędzie: ${call.function.name}`);
              continue;
            }
            try {
              const args = JSON.parse(call.function.arguments);
              const result = await tool.execute(args);
              session.addToolResult(call.id, result);
            } catch (error) {
              session.addToolResult(
                call.id,
                `Błąd wykonania: ${error instanceof Error ? error.message : String(error)}`,
              );
            }
          }
          // Continue loop — AI will process tool results
          continue;
        }

        // 4. No tool calls — agent finished
        break;
      }

      return {
        runId,
        status: 'success',
        files: this.extractFiles(session),
        output: session.messages
          .filter((m) => m.role === 'assistant')
          .map((m) => m.content)
          .join('\n\n'),
        stepsUsed: stepCount,
        tokensUsed: session.tokensUsed,
      };
    } catch (error) {
      return {
        runId,
        status: 'failed',
        files: [],
        output: '',
        stepsUsed: stepCount,
        tokensUsed: session.tokensUsed,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private buildUserPrompt(input: WorkflowInput): string {
    return `Stwórz kompletny plan dla projektu:

**Nazwa:** ${input.projectName}
**Opis:** ${input.projectDescription}
**Stack:** ${input.stack.join(', ')}

Wygeneruj wszystkie pliki i zapisz je w katalogu: ${input.outputDir}

Po wygenerowaniu każdego pliku użyj narzędzia file_write aby go zapisać.`;
  }

  private extractFiles(session: AgentSession): string[] {
    const files: string[] = [];
    for (const msg of session.messages) {
      if (msg.role === 'tool' && msg.content.startsWith('Plik zapisany:')) {
        const match = msg.content.match(/Plik zapisany: (.+)/);
        if (match) files.push(match[1]);
      }
    }
    return files;
  }
}
