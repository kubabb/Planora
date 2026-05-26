// planora web — launch the Planora web app

import { Command } from 'commander';
import { spawn } from 'node:child_process';
import * as path from 'node:path';

export const webCommand = new Command('web')
  .description('Launch Planora web app (localhost:4173)')
  .option('-p, --port <port>', 'Port number', '4173')
  .action(async (options) => {
    const webDir = path.join(import.meta.dirname, '..', '..', '..', 'web');
    console.log(`\n🌐 Planora Web App\n`);
    console.log(`  Uruchamianie na http://localhost:${options.port}...\n`);

    const child = spawn('npx', ['vite', '--port', options.port, '--open'], {
      cwd: webDir,
      stdio: 'inherit',
    });

    child.on('error', (err) => {
      console.log(`❌ Błąd: ${err.message}`);
      console.log('   Upewnij się, że packages/web jest skonfigurowany.\n');
    });
  });
