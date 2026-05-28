// planora review — review code via AI agent

import { Command } from 'commander';
import { REVIEWER_SYSTEM_PROMPT_PL } from 'planora-runner';
import { prepareAgent, saveRun, displayResult, parseFiles } from './helpers.js';

export const reviewCommand = new Command('review')
  .description('Review code via AI agent')
  .option('-p, --project <dir>', 'Project directory', '.')
  .option('-F, --files <list>', 'Files to review (comma separated)')
  .action(async (options) => {
    const ctx = prepareAgent(options);
    if (!ctx) return;

    const files = parseFiles(options.files, ctx.projectDir);

    console.log(`\n🔍 Planora Reviewer`);
    console.log(`  Projekt: ${ctx.projectName}`);
    console.log(`  Pliki:   ${files.length > 0 ? files.join(', ') : '(cały projekt)'}`);
    console.log('⏳ Agent pracuje...\n');

    try {
      const result = await ctx.agent.review(
        { projectName: ctx.projectName, files, projectDir: ctx.projectDir },
        REVIEWER_SYSTEM_PROMPT_PL,
      );

      saveRun(result, ctx.projectName, 'review');
      displayResult(result, 'Review zakończony');
    } catch (error) {
      console.log(`❌ Błąd: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  });
