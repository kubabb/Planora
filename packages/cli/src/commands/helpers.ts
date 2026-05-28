// Shared CLI helpers — extracted from plan/code/review commands
// Reduces ~150 lines of duplication across 3 files

import type { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  loadConfig,
  getActiveProvider,
  createAiClient,
  SqliteStorage,
} from 'planora-core';
import { PlanoraAgent } from 'planora-runner';
import type { WorkflowOutput } from 'planora-runner';

interface AgentContext {
  agent: PlanoraAgent;
  projectName: string;
  projectDir: string;
}

/** Check AI config and create agent context. Returns null if not configured. */
export function prepareAgent(options: { project?: string }): AgentContext | null {
  const config = loadConfig();
  const provider = getActiveProvider(config);
  if (!provider) {
    console.log('\n❌ AI nie skonfigurowany. Uruchom: planora config\n');
    return null;
  }

  const projectDir = path.resolve(options.project || '.');
  let projectName = path.basename(projectDir);

  // Read planora.json for project name
  const planoraJson = path.join(projectDir, '.planora', 'planora.json');
  if (fs.existsSync(planoraJson)) {
    try {
      const json = JSON.parse(fs.readFileSync(planoraJson, 'utf-8'));
      projectName = json.name || projectName;
    } catch { /* ignore */ }
  }

  // Detect provider key from config
  const providerKey = Object.keys(config.providers)[0] || 'openrouter';

  const client = createAiClient({
    provider: providerKey as 'openrouter' | 'openai' | 'ollama' | 'opencode',
    apiKey: provider.apiKey,
    model: provider.model,
    baseUrl: provider.baseUrl,
    temperature: provider.temperature,
    maxTokens: provider.maxTokens,
  });

  const agent = new PlanoraAgent(client);
  return { agent, projectName, projectDir };
}

/** Save a completed run to SQLite (non-critical). */
export function saveRun(run: WorkflowOutput, projectName: string, workflow: string): void {
  try {
    const storage = new SqliteStorage();
    storage.createRun({
      id: run.runId,
      projectId: projectName,
      workflow,
      status: run.status,
      output: run.output.slice(0, 500),
      stepsUsed: run.stepsUsed,
      tokensUsed: run.tokensUsed,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      error: run.error,
    });
    storage.close();
  } catch { /* SQLite is optional */ }
}

/** Display agent run result */
export function displayResult(result: WorkflowOutput, label: string): void {
  if (result.status === 'success') {
    console.log(`✓ ${label}!\n`);
    console.log(`  Kroki:  ${result.stepsUsed}`);
    console.log(`  Tokeny: ${result.tokensUsed}`);
    if (result.output.length < 2000) {
      console.log('');
      console.log(result.output);
    }
    console.log('');
  } else {
    console.log(`❌ Błąd: ${result.error}\n`);
  }
}

/** Parse comma-separated file list */
export function parseFiles(raw: string | undefined, baseDir?: string): string[] {
  if (!raw) return [];
  return raw.split(',').map((f) => {
    const trimmed = f.trim();
    return baseDir ? path.join(baseDir, trimmed) : trimmed;
  });
}
