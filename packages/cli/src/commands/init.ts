// planora init — initialize a new Planora project

import { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';
import { planoraJsonGenerator, loadConfig, getActiveProvider, getConfigPath } from '@planora/core';

export const initCommand = new Command('init')
  .description('Initialize a new Planora project')
  .option('-n, --name <name>', 'Project name')
  .option('-d, --description <desc>', 'Project description')
  .option('-s, --stack <items>', 'Tech stack (comma separated)')
  .action(async (options) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (q: string): Promise<string> => new Promise((r) => rl.question(q, r));

    let name = options.name;
    let description = options.description;
    let stack = options.stack;

    if (!name || !description || !stack) {
      console.log('\n📦 Planora — inicjalizacja nowego projektu\n');

      if (!name) {
        name = await ask('Nazwa projektu: ');
        if (!name.trim()) { console.log('❌ Nazwa jest wymagana.\n'); rl.close(); return; }
      }

      if (!description) {
        description = await ask('Opis (krótki): ') || 'A new project';
      }

      if (!stack) {
        const def = 'TypeScript, Node.js';
        stack = await ask(`Stack technologiczny (oddziel przecinkami) [${def}]: `) || def;
      }
    }

    rl.close();

    const projectId = crypto.randomUUID();
    const projectDir = path.join(process.cwd(), name!);

    if (fs.existsSync(projectDir)) {
      console.log(`\n❌ Katalog "${name}" już istnieje.\n`);
      return;
    }

    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(path.join(projectDir, '.planora'), { recursive: true });

    // planora.json
    const jsonContent = planoraJsonGenerator.generate({
      projectId,
      projectName: name!,
      stack: stack!,
      files: [],
    });
    fs.writeFileSync(path.join(projectDir, '.planora', 'planora.json'), jsonContent, 'utf-8');

    // .gitignore
    fs.writeFileSync(path.join(projectDir, '.gitignore'), '.planora/\nnode_modules/\ndist/\n.env\n', 'utf-8');

    console.log(`\n✓ Projekt "${name}" utworzony w ${projectDir}/\n`);
    console.log(`  ID:      ${projectId}`);
    console.log(`  Stack:   ${stack}`);
    console.log(`  Config:  .planora/planora.json\n`);

    // Check if AI is configured
    const config = loadConfig();
    const provider = getActiveProvider(config);

    if (provider) {
      console.log(`  AI:      ✓ skonfigurowany (${provider.model})`);
      console.log(`  Config:  ${getConfigPath()}\n`);
      console.log(`  Następny krok: planora plan --ai\n`);
    } else {
      console.log(`  AI:      ❌ nie skonfigurowany`);
      console.log(`  Uruchom: planora config\n`);
      console.log(`  Następny krok: planora plan\n`);
    }
  });
