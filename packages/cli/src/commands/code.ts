// planora code — implement feature via agent

import { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  loadConfig,
  getActiveProvider,
  createAiClient,
  SqliteStorage,
} from '@planora/core';
import { PlanoraAgent, CODER_SYSTEM_PROMPT_PL } from '@planora/runner';

export const codeCommand = new Command('code')
  .description('Implement a feature via AI agent')
  .option('-f, --feature <name>', 'Feature description')
  .option('-p, --project <dir>', 'Project directory', '.')
  .option('-F, --files <list>', 'Files to modify (comma separated)')
  .action(async (options) => {
    if (!options.feature) {
      console.log('\n❌ Podaj nazwę funkcji: planora code -f "dodaj logowanie"\n');
      return;
    }

    const config = loadConfig();
    const provider = getActiveProvider(config);
    if (!provider) {
      console.log('\n❌ AI nie skonfigurowany. Uruchom: planora config\n');
      return;
    }

    const projectDir = path.resolve(options.project);
    const files = options.files
      ? options.files.split(',').map((f: string) => f.trim())
      : [];

    // Read planora.json for project info
    let projectName = path.basename(projectDir);
    const planoraJson = path.join(projectDir, '.planora', 'planora.json');
    if (fs.existsSync(planoraJson)) {
      const json = JSON.parse(fs.readFileSync(planoraJson, 'utf-8'));
      projectName = json.name || projectName;
    }

    console.log(`\n💻 Planora Coder — "${options.feature}"`);
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
      const result = await agent.code(
        {
          projectName,
          feature: options.feature,
          files,
          projectDir,
        },
        CODER_SYSTEM_PROMPT_PL,
      );

      // Save run
      try {
        const storage = new SqliteStorage();
        storage.createRun({
          id: result.runId,
          projectId: projectName,
          workflow: 'code',
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
        console.log('✓ Funkcja zaimplementowana!\n');
        console.log(`  Kroki:  ${result.stepsUsed}`);
        console.log(`  Tokeny: ${result.tokensUsed}`);
        console.log('');
        console.log(result.output.slice(0, 1000));
        console.log('');
      } else {
        console.log(`❌ Błąd: ${result.error}\n`);
      }
    } catch (error) {
      console.log(`❌ Błąd: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  });
