// planora roadmap — standalone ROADMAP.md generator

import { Command } from 'commander';
import * as fs from 'node:fs';
import { roadmapGenerator } from '@planora/core';

export const roadmapCommand = new Command('roadmap')
  .description('Generate ROADMAP.md')
  .option('-n, --name <name>', 'Project name', 'my-project')
  .option('-p, --phases <num>', 'Number of phases', '4')
  .option('-o, --output <file>', 'Output file', 'ROADMAP.md')
  .action(async (options) => {
    const content = roadmapGenerator.generate({
      projectName: options.name,
      phases: parseInt(options.phases),
    });
    fs.writeFileSync(options.output, content, 'utf-8');
    console.log(`✓ ROADMAP.md wygenerowany (${options.phases} fazy)\n`);
  });
