// planora config — AI provider configuration wizard

import { Command } from 'commander';
import * as readline from 'node:readline';
import {
  loadConfig,
  saveConfig,
  upsertProvider,
  redactConfig,
  validateAndTest,
  getConfigPath,
} from '@planora/core';
import { createAiClient } from '@planora/core';
import type { PlanoraConfig } from '@planora/core';

export const configCommand = new Command('config')
  .description('Configure Planora AI provider')
  .option('--show', 'Show current config (apiKey masked)')
  .option('--test', 'Test connection to AI provider')
  .action(async (options) => {
    if (options.show) {
      showConfig();
      return;
    }
    if (options.test) {
      await testConnection();
      return;
    }
    // Default: run wizard
    await runWizard();
  });

function showConfig(): void {
  const config = loadConfig();
  const safe = redactConfig(config);
  const path = getConfigPath();

  console.log(`\n📁 Config file: ${path}\n`);
  console.log(JSON.stringify(safe, null, 2));
}

async function testConnection(): Promise<void> {
  const config = loadConfig();
  const providerKeys = Object.keys(config.providers);

  if (providerKeys.length === 0) {
    console.log('\n❌ No providers configured. Run: planora config\n');
    return;
  }

  console.log('\n⏳ Testing connection...\n');
  const result = await validateAndTest(config);

  if (result.connectionTest?.ok) {
    console.log(`  ✓ Connected!`);
    console.log(`    Model:  ${result.connectionTest.model}`);
    console.log(`    Latency: ${result.connectionTest.latency}ms\n`);
  } else {
    console.log(`  ✗ Connection failed`);
    console.log(`    Error: ${result.connectionTest?.error || result.errors.join(', ')}\n`);
  }
}

async function runWizard(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (query: string): Promise<string> =>
    new Promise((resolve) => rl.question(query, resolve));

  console.log(`
  ╔══════════════════════════════════════╗
  ║       Planora — AI Setup            ║
  ╚══════════════════════════════════════╝

  Planora używa AI do generowania planów projektów.
  Potrzebny jest tylko klucz API do wybranego providera.
  Klucz jest przechowywany lokalnie i NIGDY nie opuszcza Twojego komputera.
  `);

  // Step 1: Provider
  console.log('Dostępni providerzy:');
  console.log('  1. OpenRouter  (recommended — access to 200+ models)');
  console.log('  2. OpenAI      (direct)');
  console.log('  3. Ollama      (local — free & private)');
  console.log('  4. OpenCode    (cloud)');
  console.log('');

  const choice = await ask('Wybierz numer (1-4) [1]: ');
  const providerMap: Record<string, string> = { '1': 'openrouter', '2': 'openai', '3': 'ollama', '4': 'opencode' };
  const provider = providerMap[choice.trim() || '1'] || 'openrouter';

  // Step 2: API Key
  const apiKey = await ask('\nKlucz API: ');
  if (!apiKey.trim()) {
    console.log('\n❌ Klucz API jest wymagany.\n');
    rl.close();
    return;
  }

  // Step 3: Model
  const defaultModels: Record<string, string> = {
    openrouter: 'anthropic/claude-sonnet-4',
    openai: 'gpt-4o',
    ollama: 'llama3.1:8b',
    opencode: 'gpt-4o',
  };
  const defaultModel = defaultModels[provider] || 'gpt-4o';

  const skipModel = provider === 'ollama';
  const model = skipModel
    ? defaultModel
    : await ask(`Domyślny model [${defaultModel}]: `) || defaultModel;

  // Step 4: Base URL (for Ollama)
  let baseUrl: string | undefined;
  if (provider === 'ollama') {
    baseUrl = await ask('Ollama URL [http://localhost:11434/v1]: ') || 'http://localhost:11434/v1';
  }

  // Save config
  const config = loadConfig();
  const updated = upsertProvider(config, 'default', {
    apiKey,
    model,
    baseUrl,
    temperature: 0.7,
    maxTokens: 4096,
  });

  saveConfig(updated);
  console.log(`\n  ✓ Konfiguracja zapisana w ${getConfigPath()}`);
  console.log(`    Uprawnienia: 600 (tylko Ty masz dostęp)\n`);

  // Step 5: Test connection
  const testChoice = await ask('Sprawdzić połączenie? (Y/n) [Y]: ');
  if (testChoice.toLowerCase() !== 'n') {
    console.log('\n⏳ Testowanie połączenia...');
    const result = await validateAndTest(updated);

    if (result.connectionTest?.ok) {
      console.log(`  ✓ Połączono!`);
      console.log(`    Model:   ${result.connectionTest.model}`);
      console.log(`    Latency: ${result.connectionTest.latency}ms\n`);
    } else {
      console.log(`  ✗ Błąd połączenia: ${result.connectionTest?.error || result.errors.join(', ')}`);
      console.log(`    Konfiguracja zapisana. Sprawdź klucz API.\n`);
    }
  }

  console.log('  Planora gotowa. Spróbuj: planora plan --ai\n');
  rl.close();
}
