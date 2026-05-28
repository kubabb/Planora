// planora code — implement feature via agent

import { Command } from 'commander';
import { CODER_SYSTEM_PROMPT_PL } from 'planora-runner';
import { prepareAgent, saveRun, displayResult, parseFiles } from './helpers.js';

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

    const ctx = prepareAgent(options);
    if (!ctx) return;

    console.log(`\n💻 Planora Coder — "${options.feature}"`);
    console.log(`  Projekt: ${ctx.projectName}`);
    console.log('⏳ Agent pracuje...\n');

    try {
      const files = parseFiles(options.files);
      const result = await ctx.agent.code(
        { projectName: ctx.projectName, feature: options.feature, files, projectDir: ctx.projectDir },
        CODER_SYSTEM_PROMPT_PL,
      );

      saveRun(result, ctx.projectName, 'code');
      displayResult(result, 'Funkcja zaimplementowana');
    } catch (error) {
      console.log(`❌ Błąd: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  });
