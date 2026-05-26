// planora review — review code via AI agent

import { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  loadConfig,
  getActiveProvider,
  createAiClient,
  SqliteStorage,
} from '@planora/core';
import { PlanoraAgent, REVIEWER_SYSTEM_PROMPT_PL } from '@planora/runner';

export const reviewCommand = new Command('review')
  .description('Review code via AI agent')
  .option('-p, --project <dir>', 'Project directory', '.')
  .option('-F, --files <list>', 'Files to review (comma separated)')
  .action(async (options) => {
    const config = loadConfig();
    const provider = getActiveProvider(config);
    if (!provider) {
      console.log('\n❌ AI nie skonfigurowany. Uruchom: planora config\n');
      return;
    }

    const projectDir = path.resolve(options.project);
    const files = options.files
      ? options.files.split(',').map((f: string) => path.join(projectDir, f.trim()))
      : [];

    let projectName = path.basename(projectDir);
    const planoraJson = path.join(projectDir, '.planora', 'planora.json');
    if (fs.existsSync(planoraJson)) {
      const json = JSON.parse(fs.readFileSync(planoraJson, 'utf-8'));
      projectName = json.name || projectName;
    }

    console.log(`\n🔍 Planora Reviewer`);
    console.log(`  Projekt: ${projectName}`);
    console.log(`  Pliki:   ${files.length > 0 ? files.join(', ') : '(cały projekt)'}`);
    console.log('⏳ Agent pracuje...\n');

    try {
      const client = createAiClient({
        provider: 'openrouter',
        apiKey: provider.apiKey,
        model: provider.model,
        baseUrl: provider.baseUrl,
      });

      const agent = new PlanoraAgent(client);
      const result = await agent.review(
        { projectName, files, projectDir },
        REVIEWER_SYSTEM_PROMPT_PL,
      );

      // Save run
      try {
        const storage = new SqliteStorage();
        storage.createRun({
          id: result.runId,
          projectId: projectName,
          workflow: 'review',
          status: result.status,
          output: result.output.slice(0, 500),
          stepsUsed: result.stepsUsed,
          tokensUsed: result.tokensUsed,
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
          error: result.error,
        });
        storage.close();
      } catch { /* optional */ }

      if (result.status === 'success') {
        console.log('✓ Review zakończony!\n');
        console.log(result.output);
        console.log('');
      } else {
        console.log(`❌ Błąd: ${result.error}\n`);
      }
    } catch (error) {
      console.log(`❌ Błąd: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  });
