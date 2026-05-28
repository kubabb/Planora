// planora plan — generate project plans

import { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  loadConfig,
  getActiveProvider,
  createAiClient,
  projectPlanGenerator,
  roadmapGenerator,
  mindmapGenerator,
  architectureGenerator,
  agentSetupGenerator,
  planoraJsonGenerator,
  SqliteStorage,
} from 'planora-core';
import { PlanoraAgent, plannerSystemPrompt } from 'planora-runner';
import { saveRun, displayResult } from './helpers.js';

export const planCommand = new Command('plan')
  .description('Generate project plan files')
  .option('-n, --name <name>', 'Project name')
  .option('-d, --description <desc>', 'Project description')
  .option('-s, --stack <items>', 'Tech stack (comma separated)')
  .option('-t, --timeline <time>', 'Available time, e.g. "2 weeks", "3 months"')
  .option('-o, --output <dir>', 'Output directory', '.')
  .option('--ai', 'Use AI agent to generate plan')
  .action(async (options) => {
    const name = options.name || 'my-project';
    const description = options.description || 'A new project';
    const stack = options.stack || 'TypeScript, Node.js';
    const timeline = options.timeline || 'not specified';
    const outputDir = options.output || '.';

    if (options.ai) {
      await generateWithAi(name, description, stack, timeline, outputDir);
    } else {
      await generateStatic(name, description, stack, timeline, outputDir);
    }
  });

async function generateStatic(
  name: string,
  description: string,
  stack: string,
  timeline: string,
  outputDir: string,
): Promise<void> {
  console.log(`\n📝 Generowanie planu dla "${name}" (szablony statyczne)...\n`);

  const projectId = crypto.randomUUID();
  const projectDir = path.join(outputDir, name);

  // Auto-init if directory doesn't exist
  if (!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(path.join(projectDir, '.planora'), { recursive: true });
    fs.writeFileSync(path.join(projectDir, '.gitignore'), '.planora/\nnode_modules/\ndist/\n.env\n', 'utf-8');

    try {
      const storage = new SqliteStorage();
      storage.createUser({ id: 'local', name: 'local', profile: 'local' });
      storage.createProject({
        id: projectId, name, description, userId: 'local', stack, basePath: projectDir,
      });
      storage.close();
    } catch { /* optional */ }
  }

  const files: [string, string][] = [
    ['PROJECT_PLAN.md', projectPlanGenerator.generate({ projectName: name, description, stack, timeline })],
    ['ROADMAP.md', roadmapGenerator.generate({ projectName: name, timeline })],
    ['MINDMAP.md', mindmapGenerator.generate({ projectName: name, description, stack })],
    ['ARCHITECTURE.md', architectureGenerator.generate({ projectName: name, description, stack })],
    ['AGENT_SETUP.md', agentSetupGenerator.generate({ projectName: name, provider: 'not configured', model: 'not configured' })],
  ];

  for (const [filename, content] of files) {
    fs.writeFileSync(path.join(projectDir, filename), content, 'utf-8');
    console.log(`  ✓ ${filename}`);
  }

  const planoraJson = planoraJsonGenerator.generate({
    projectId, projectName: name, stack, timeline, files: files.map(([f]) => f),
  });
  fs.writeFileSync(path.join(projectDir, 'planora.json'), planoraJson, 'utf-8');
  console.log(`  ✓ planora.json`);
  console.log(`\n✓ Plan wygenerowany w: ${projectDir}/\n`);
  console.log(`  Otwórz dashboard: planora web\n`);
  console.log(`  Użyj --ai aby wygenerować inteligentny plan z AI:\n  planora plan -n "${name}" --ai\n`);
}

async function generateWithAi(
  name: string,
  description: string,
  stack: string,
  timeline: string,
  outputDir: string,
): Promise<void> {
  const config = loadConfig();
  const provider = getActiveProvider(config);

  if (!provider) {
    console.log('\n❌ AI agent nie jest skonfigurowany.\n   Uruchom najpierw: planora config\n');
    return;
  }

  console.log(`\n🤖 Planora Agent — "${name}"\n  Model: ${provider.model}\n  Output: ${outputDir}\n⏳ Agent pracuje...\n`);

  try {
    const client = createAiClient({
      provider: provider.provider ?? 'openrouter',
      apiKey: provider.apiKey, model: provider.model, baseUrl: provider.baseUrl,
      temperature: provider.temperature, maxTokens: provider.maxTokens,
    });

    const agent = new PlanoraAgent(client);
    const result = await agent.plan(
      { projectName: name, projectDescription: description, stack: stack.split(',').map(s => s.trim()), timeline, outputDir },
      plannerSystemPrompt('pl'),
    );

    saveRun(result, name, 'plan');

    if (result.status === 'success') {
      const projectId = crypto.randomUUID();
      const projectDir = path.join(outputDir, name);
      try {
        const storage = new SqliteStorage();
        storage.createUser({ id: 'local', name: 'local', profile: 'local' });
        storage.createProject({
          id: projectId, name, description, userId: 'local', stack: JSON.stringify({ stack, timeline }), basePath: projectDir,
        });
        storage.close();
      } catch { /* optional */ }

      console.log('✓ Plan wygenerowany!\n');
      console.log(`  Kroki:  ${result.stepsUsed}\n  Tokeny: ${result.tokensUsed}`);
      if (result.files.length > 0) {
        console.log(`  Pliki:`);
        for (const f of result.files) console.log(`    - ${f}`);
      }
      console.log(`\n  Otwórz dashboard: planora web\n`);
    } else {
      console.log(`❌ Błąd: ${result.error}\n`);
    }
  } catch (error) {
    console.log(`❌ Błąd: ${error instanceof Error ? error.message : String(error)}\n`);
  }
}
