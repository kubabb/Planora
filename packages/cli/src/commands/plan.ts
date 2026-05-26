// planora plan — generate project plans

import { Command } from 'commander';
import {
  loadConfig,
  getActiveProvider,
  createAiClient,
} from '@planora/core';
import { PlanoraAgent, plannerSystemPrompt } from '@planora/runner';

export const planCommand = new Command('plan')
  .description('Generate project plan files')
  .option('-n, --name <name>', 'Project name')
  .option('-d, --description <desc>', 'Project description')
  .option('-s, --stack <items>', 'Tech stack (comma separated)')
  .option('-o, --output <dir>', 'Output directory', '.')
  .option('--ai', 'Use AI agent to generate plan')
  .action(async (options) => {
    const name = options.name || 'my-project';
    const description = options.description || 'A new project';
    const stack = options.stack
      ? options.stack.split(',').map((s: string) => s.trim())
      : ['TypeScript', 'Node.js'];
    const outputDir = options.output || '.';

    if (options.ai) {
      await generateWithAi(name, description, stack, outputDir);
    } else {
      console.log('\n📝 Generowanie planu z szablonów (bez AI)...');
      console.log('   (static templates — not yet implemented)\n');
      console.log('   Użyj --ai aby wygenerować plan z AI: planora plan --ai\n');
    }
  });

async function generateWithAi(
  name: string,
  description: string,
  stack: string[],
  outputDir: string,
): Promise<void> {
  const config = loadConfig();
  const provider = getActiveProvider(config);

  if (!provider) {
    console.log('\n❌ AI agent nie jest skonfigurowany.');
    console.log('   Uruchom najpierw: planora config\n');
    return;
  }

  console.log(`\n🤖 Planora Agent — generowanie planu dla "${name}"\n`);
  console.log(`  Provider: ${provider.model}`);
  console.log(`  Stack:    ${stack.join(', ')}`);
  console.log(`  Output:   ${outputDir}\n`);
  console.log('⏳ Agent pracuje...\n');

  try {
    const client = createAiClient({
      provider: 'openrouter', // auto-detected
      apiKey: provider.apiKey,
      model: provider.model,
      baseUrl: provider.baseUrl,
      temperature: provider.temperature,
      maxTokens: provider.maxTokens,
    });

    const agent = new PlanoraAgent(client);
    const result = await agent.plan(
      {
        projectName: name,
        projectDescription: description,
        stack,
        outputDir,
      },
      plannerSystemPrompt('pl'),
    );

    if (result.status === 'success') {
      console.log('✓ Plan wygenerowany!\n');
      console.log(`  Kroki:    ${result.stepsUsed}`);
      console.log(`  Tokeny:   ${result.tokensUsed}`);
      console.log(`  Run ID:   ${result.runId}`);
      if (result.files.length > 0) {
        console.log(`  Pliki:`);
        for (const f of result.files) {
          console.log(`    - ${f}`);
        }
      }
      console.log('');
    } else {
      console.log(`❌ Błąd: ${result.error}\n`);
    }
  } catch (error) {
    console.log(`❌ Błąd połączenia z AI: ${error instanceof Error ? error.message : String(error)}\n`);
  }
}
