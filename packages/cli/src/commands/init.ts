// planora init — initialize a new Planora project

import { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';
import {
  planoraJsonGenerator,
  loadConfig,
  getActiveProvider,
  getConfigPath,
  SqliteStorage,
} from 'planora-core';

export const initCommand = new Command('init')
  .description('Initialize a new Planora project')
  .option('-n, --name <name>', 'Project name')
  .option('-d, --description <desc>', 'Project description')
  .option('-s, --stack <items>', 'Tech stack (comma separated)')
  .option('-t, --timeline <time>', 'Available time, e.g. "2 weeks", "3 months"')
  .action(async (options) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ask = (q: string): Promise<string> => new Promise((r) => rl.question(q, r));

    let name = options.name;
    let description = options.description;
    let stack = options.stack;
    let timeline = options.timeline;

    if (!name || !description || !stack || !timeline) {
      console.log('\n📦 Planora — inicjalizacja nowego projektu\n');

      if (!name) {
        name = await ask('Nazwa projektu: ');
        if (!name.trim()) { console.log('❌ Nazwa jest wymagana.\n'); rl.close(); return; }
      }

      if (!description) {
        description = await ask('Opis (krótki): ') || 'A new project';
      }

      if (!timeline) {
        timeline = await ask('Ile masz czasu na stworzenie projektu? [2 tygodnie]: ') || '2 tygodnie';
      }

      if (!stack) {
        const def = 'TypeScript, Node.js';
        const answer = await ask(`Stack technologiczny (oddziel przecinkami; wpisz "nie wiem" dla sugestii) [${def}]: `);
        stack = shouldRecommendStack(answer) ? await recommendStack(ask) : (answer || def);
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
      description: description!,
      stack: stack!,
      timeline: timeline!,
      files: [],
    });
    fs.writeFileSync(path.join(projectDir, '.planora', 'planora.json'), jsonContent, 'utf-8');

    // .gitignore
    fs.writeFileSync(path.join(projectDir, '.gitignore'), '.planora/\nnode_modules/\ndist/\n.env\n', 'utf-8');

    // Save to SQLite
    try {
      const storage = new SqliteStorage();
      storage.createUser({ id: 'local', name: 'local', profile: 'local' });
      storage.createProject({
        id: projectId,
        name: name!,
        description: description!,
        userId: 'local',
        stack: JSON.stringify({ stack, timeline }),
        basePath: projectDir,
      });
      storage.close();
    } catch (e) {
      // SQLite is optional — init still works without it
    }

    console.log(`\n✓ Projekt "${name}" utworzony w ${projectDir}/\n`);
    console.log(`  ID:      ${projectId}`);
    console.log(`  Stack:   ${stack}`);
    console.log(`  Czas:    ${timeline}`);
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

function shouldRecommendStack(value: string | undefined): boolean {
  const normalized = (value || '').trim().toLowerCase();
  return ['nie wiem', 'niewiem', 'nie wiem jeszcze', 'idk', "don't know", 'help', '?'].includes(normalized);
}

async function recommendStack(ask: (q: string) => Promise<string>): Promise<string> {
  const web = (await ask('Czy to ma być webówka/aplikacja w przeglądarce? (Y/n) [Y]: ') || 'Y').toLowerCase() !== 'n';
  const api = (await ask('Czy potrzebujesz backend/API? (Y/n) [Y]: ') || 'Y').toLowerCase() !== 'n';
  const db = (await ask('Czy projekt ma zapisywać dane użytkowników? (Y/n) [Y]: ') || 'Y').toLowerCase() !== 'n';
  const mobile = (await ask('Czy potrzebujesz mobile app? (y/N) [N]: ') || 'N').toLowerCase() === 'y';

  if (mobile) return 'TypeScript, React Native, Expo, SQLite/Supabase';
  if (web && api && db) return 'TypeScript, Next.js, Node.js, PostgreSQL, Prisma';
  if (web && api) return 'TypeScript, React, Node.js, SQLite';
  if (web) return 'TypeScript, React, Vite';
  if (api && db) return 'TypeScript, Node.js, PostgreSQL, Prisma';
  return 'TypeScript, Node.js';
}
