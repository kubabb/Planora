// planora agent — agent status and run history

import { Command } from 'commander';
import { loadConfig, getActiveProvider, redactConfig } from '@planora/core';

export const agentCommand = new Command('agent')
  .description('Agent status and history')
  .option('--status', 'Show agent status')
  .option('--history', 'Show run history')
  .action(async (options) => {
    if (options.history) {
      await showHistory();
      return;
    }
    // Default: show status
    await showStatus();
  });

async function showStatus(): Promise<void> {
  const config = loadConfig();
  const provider = getActiveProvider(config);

  if (!provider) {
    console.log('\n❌ Agent nie jest skonfigurowany.');
    console.log('   Uruchom: planora config\n');
    return;
  }

  const safe = redactConfig(config);

  console.log('\n🤖 Planora Agent Status\n');
  console.log(`  Provider:  ${Object.keys(config.providers).find(k => config.providers[k] === provider) || 'default'}`);
  console.log(`  Model:     ${provider.model}`);
  console.log(`  API Key:   ${safe.providers.default?.apiKey || '****'}`);
  if (provider.baseUrl) {
    console.log(`  URL:       ${provider.baseUrl}`);
  }
  console.log(`  Config:    ~/.planora/config.json`);
  console.log(`  Version:   0.1.0\n`);
}

async function showHistory(): Promise<void> {
  console.log('\n📜 Run history — jeszcze nie zaimplementowane (potrzebna baza SQLite)\n');
}
