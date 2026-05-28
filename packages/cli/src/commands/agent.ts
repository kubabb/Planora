// planora agent — agent status and run history

import { Command } from 'commander';
import {
  loadConfig,
  redactConfig,
  SqliteStorage,
} from 'planora-core';

export const agentCommand = new Command('agent')
  .description('Agent status and history')
  .option('--status', 'Show agent status')
  .option('--history', 'Show run history (all projects)')
  .action(async (options) => {
    if (options.history) {
      await showHistory();
      return;
    }
    await showStatus();
  });

async function showStatus(): Promise<void> {
  const config = loadConfig();
  const safe = redactConfig(config);
  const providerKey = Object.keys(config.providers)[0] || 'default';
  const safeProvider = safe.providers[providerKey];

  if (!safeProvider) {
    console.log('\n❌ Agent nie jest skonfigurowany.');
    console.log('   Uruchom: planora config\n');
    return;
  }

  console.log('\n🤖 Planora Agent Status\n');
  console.log(`  Provider:  ${providerKey}`);
  console.log(`  Model:     ${safeProvider.model}`);
  console.log('  API Key:   configured (redacted)');
  if (safeProvider.baseUrl) {
    console.log(`  URL:       ${safeProvider.baseUrl}`);
  }
  console.log(`  Config:    ~/.planora/config.json`);
  console.log(`  Version:   0.1.0\n`);
}

async function showHistory(): Promise<void> {
  console.log('\n📜 Agent Run History\n');

  try {
    const storage = new SqliteStorage();
    const projects = storage.listProjects() as Array<{ id: string; name: string }>;
    storage.close();

    if (projects.length === 0) {
      console.log('  Brak projektów. Uruchom: planora init\n');
      return;
    }

    for (const project of projects) {
      const s2 = new SqliteStorage();
      const runs = s2.listRuns(project.id) as Array<{
        id: string;
        workflow: string;
        status: string;
        steps_used: number;
        tokens_used: number;
        started_at: string;
        error?: string;
      }>;
      s2.close();

      console.log(`  📁 ${project.name} (${project.id.slice(0, 8)}...)`);
      if (runs.length === 0) {
        console.log('     (brak runów)\n');
        continue;
      }
      for (const run of runs) {
        const icon = run.status === 'success' ? '✅' : run.status === 'failed' ? '❌' : '🟡';
        console.log(`     ${icon} ${run.workflow} — ${run.status} (${run.steps_used} steps, ${run.tokens_used} tokens) ${run.started_at}`);
        if (run.error) console.log(`        Error: ${run.error}`);
      }
      console.log('');
    }
  } catch (e) {
    console.log(`  Błąd odczytu bazy: ${e instanceof Error ? e.message : String(e)}\n`);
  }
}
