// planora web — launch the Planora web dashboard
// Serves built assets from packages/web/dist (production) or runs Vite dev server (--dev)

import { Command } from 'commander';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

// MIME types for static file serving
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
};

function getMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

export const webCommand = new Command('web')
  .description('Launch the Planora web dashboard')
  .option('-p, --port <number>', 'Port to listen on', '4173')
  .option('--dev', 'Run Vite dev server instead of serving built assets')
  .action((options: { port: string; dev?: boolean }) => {
    const port = parseInt(options.port, 10);
    const webPackageDir = join(import.meta.dirname, '..', '..', 'web');
    const distDir = join(webPackageDir, 'dist');

    if (options.dev) {
      // Dev mode: spawn Vite dev server
      console.log(`\n🚀 Starting Planora web in DEV mode...`);
      console.log(`   Vite dev server will start on http://localhost:${port}\n`);
      
      const child = spawn('npx', ['vite', '--port', String(port)], {
        cwd: webPackageDir,
        stdio: 'inherit',
        shell: true,
      });
      
      child.on('exit', (code) => {
        process.exit(code ?? 0);
      });
    } else {
      // Production mode: serve static files from dist
      if (!existsSync(distDir)) {
        console.error(`\n❌ Error: Web app not built yet.`);
        console.error(`   Expected dist directory: ${distDir}`);
        console.error(`\n   To fix this, run:`);
        console.error(`   $ npm run build --workspace @planora/web\n`);
        process.exit(1);
      }

      const indexHtmlPath = join(distDir, 'index.html');
      if (!existsSync(indexHtmlPath)) {
        console.error(`\n❌ Error: index.html not found in dist directory.`);
        console.error(`   Expected: ${indexHtmlPath}\n`);
        process.exit(1);
      }

      const indexHtml = readFileSync(indexHtmlPath, 'utf-8');

      const server = createServer((req, res) => {
        const url = new URL(req.url || '/', `http://localhost:${port}`);
        const pathname = url.pathname;

        // Try to serve the requested file
        const filePath = join(distDir, pathname);

        // Security: prevent directory traversal
        if (!filePath.startsWith(distDir)) {
          res.writeHead(403, { 'Content-Type': 'text/plain' });
          res.end('Forbidden');
          return;
        }

        // Check if file exists and is not a directory
        if (existsSync(filePath) && statSync(filePath).isFile()) {
          const content = readFileSync(filePath);
          const mimeType = getMimeType(filePath);
          res.writeHead(200, { 'Content-Type': mimeType });
          res.end(content);
        } else {
          // SPA fallback: serve index.html for all routes (client-side routing)
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(indexHtml);
        }
      });

      server.listen(port, () => {
        console.log(`\n📊 Planora Dashboard`);
        console.log(`   Local:   http://localhost:${port}`);
        console.log(`   Network: http://0.0.0.0:${port}\n`);
        console.log(`   Press Ctrl+C to stop.\n`);
      });

      server.on('error', (err) => {
        if ((err as NodeJS.ErrnoException).code === 'EADDRINUSE') {
          console.error(`\n❌ Error: Port ${port} is already in use.`);
          console.error(`   Try a different port: planora web --port ${port + 1}\n`);
        } else {
          console.error(`\n❌ Server error: ${err.message}\n`);
        }
        process.exit(1);
      });
    }
  });
