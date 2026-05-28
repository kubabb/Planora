// planora mindmap — standalone MINDMAP.md generator

import { Command } from 'commander';
import * as fs from 'node:fs';
import { mindmapGenerator } from 'planora-core';

export const mindmapCommand = new Command('mindmap')
  .description('Generate MINDMAP.md')
  .option('-n, --name <name>', 'Project name', 'my-project')
  .option('-d, --description <desc>', 'Project description', '')
  .option('-s, --stack <items>', 'Tech stack (comma separated)', 'TypeScript, Node.js')
  .option('-o, --output <file>', 'Output file', 'MINDMAP.md')
  .action(async (options) => {
    const content = mindmapGenerator.generate({
      projectName: options.name,
      description: options.description,
      stack: options.stack,
    });
    fs.writeFileSync(options.output, content, 'utf-8');
    console.log(`✓ MINDMAP.md wygenerowany\n`);
  });
