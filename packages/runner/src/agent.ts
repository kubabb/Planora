// PlanoraAgent — main agent loop (think → act → observe)
// Uses AiClient for LLM calls, manages sessions and tools.

import type { AiClient, AiResponse, AiToolCall } from '@planora/core';
import { AgentSession } from './session.js';
import type { AgentConfig } from './config.js';
import { DEFAULT_AGENT_CONFIG } from './config.js';
import { getTool, getToolSchemas } from './tools/index.js';
import type { AgentRun, AgentRunStatus } from '@planora/core';
import { generateId } from './utils.js';

export interface WorkflowInput {
  projectName: string;
  projectDescription: string;
  stack: string[];
  outputDir: string;
}

export interface CodeInput {
  projectName: string;
  feature: string;
  files: string[];
  projectDir: string;
}

export interface ReviewInput {
  projectName: string;
  files: string[];
  projectDir: string;
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
    const session = new AgentSession(workflow.projectName, generateId(), this.config);
    session.addSystem(systemPrompt);
    session.addUser(this.buildPlanUserPrompt(workflow));
    return this.runLoop(session);
  }

  /**
   * Run the code workflow — implement a feature.
   */
  async code(
    input: CodeInput,
    systemPrompt: string,
  ): Promise<WorkflowOutput> {
    const session = new AgentSession(input.projectName, generateId(), this.config);
    session.addSystem(systemPrompt);
    session.addUser(this.buildCodeUserPrompt(input));
    return this.runLoop(session);
  }

  /**
   * Run the review workflow — review code changes.
   */
  async review(
    input: ReviewInput,
    systemPrompt: string,
  ): Promise<WorkflowOutput> {
    const session = new AgentSession(input.projectName, generateId(), this.config);
    session.addSystem(systemPrompt);
    session.addUser(this.buildReviewUserPrompt(input));
    return this.runLoop(session);
  }

  // ─── Core loop ────────────────────────────────────

  private async runLoop(session: AgentSession): Promise<WorkflowOutput> {
    const runId = session.runId;
    let stepCount = 0;
    const tools = getToolSchemas();
    const startTime = Date.now();

    try {
      while (stepCount < this.config.maxSteps) {
        stepCount++;

        // Check timeout
        if (Date.now() - startTime > this.config.timeoutMs) {
          return this.buildOutput(runId, 'failed', [], session, stepCount, 'Przekroczono limit czasu');
        }

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
          continue; // Back to think
        }

        // 4. No tool calls — agent finished (or needs user input)
        break;
      }

      if (stepCount >= this.config.maxSteps) {
        return this.buildOutput(runId, 'failed', [], session, stepCount, 'Przekroczono limit kroków');
      }

      return this.buildOutput(runId, 'success', this.extractFiles(session), session, stepCount);
    } catch (error) {
      return this.buildOutput(
        runId,
        'failed',
        [],
        session,
        stepCount,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  // ─── Prompt builders ──────────────────────────────

  private buildPlanUserPrompt(input: WorkflowInput): string {
    return `Stwórz kompletny plan dla projektu:

**Nazwa:** ${input.projectName}
**Opis:** ${input.projectDescription}
**Stack:** ${input.stack.join(', ')}

Wygeneruj wszystkie pliki i zapisz je w katalogu: ${input.outputDir}

Po wygenerowaniu każdego pliku użyj narzędzia file_write aby go zapisać.`;
  }

  private buildCodeUserPrompt(input: CodeInput): string {
    return `Zaimplementuj funkcję:

**Funkcja:** ${input.feature}
**Pliki do modyfikacji:** ${input.files.join(', ')}

Katalog projektu: ${input.projectDir}

Przeczytaj każdy plik, wprowadź zmiany, zapisz i zweryfikuj buildem.`;
  }

  private buildReviewUserPrompt(input: ReviewInput): string {
    return `Przejrzyj kod:

**Pliki:** ${input.files.join(', ')}

Katalog projektu: ${input.projectDir}

Wygeneruj raport code review i zakończ linią REVIEW_COMPLETE.`;
  }

  // ─── Helpers ──────────────────────────────────────

  private buildOutput(
    runId: string,
    status: AgentRunStatus,
    files: string[],
    session: AgentSession,
    steps: number,
    error?: string,
  ): WorkflowOutput {
    return {
      runId,
      status,
      files,
      output: session.messages
        .filter((m) => m.role === 'assistant')
        .map((m) => m.content)
        .join('\n\n'),
      stepsUsed: steps,
      tokensUsed: session.tokensUsed,
      error,
    };
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
