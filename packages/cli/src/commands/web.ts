// planora web — launch the Planora web dashboard
// Serves dashboard assets and provides local API for projects/settings

import { Command } from 'commander';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname, extname, relative, resolve as pathResolve, isAbsolute } from 'node:path';
import { homedir } from 'node:os';
import { createRequire } from 'node:module';
import { SqliteStorage, maskApiKey } from 'planora-core';

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
  '.md': 'text/markdown',
  '.txt': 'text/plain',
};

function getMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function resolveWebDist(): string {
  try {
    const require = createRequire(import.meta.url);
    const pkgJson = require.resolve('planora-web/package.json');
    return join(dirname(pkgJson), 'dist');
  } catch {
    // Dev fallback from packages/cli/dist/commands/web.js -> ../../../web/dist
    return join(import.meta.dirname, '..', '..', '..', 'planora-web', 'dist');
  }
}

function getSettings() {
  const configPath = join(homedir(), '.planora', 'config.json');
  try {
    const raw = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(raw);
    const providers = config.providers || {};
    const defaultKey = providers.default;
    const active = defaultKey ? providers[defaultKey] : Object.values(providers)[0];
    const apiKey = active?.apiKey || '';
    const maskedKey = maskApiKey(apiKey);
    return {
      provider: defaultKey || '',
      model: active?.model || '',
      apiKey: maskedKey,
      databasePath: join(homedir(), '.planora', 'planora.db'),
      qdrantUrl: config.qdrantUrl,
    };
  } catch {
    return {
      provider: '',
      model: '',
      apiKey: '',
      databasePath: join(homedir(), '.planora', 'planora.db'),
    };
  }
}

async function handleApiRequest(
  pathname: string,
): Promise<{ status: number; body: string; headers?: Record<string, string> }> {
  // /api/projects
  if (pathname === '/api/projects') {
    try {
      const storage = new SqliteStorage();
      const projects = storage.listProjects();
      storage.close();
      return { status: 200, body: JSON.stringify(projects) };
    } catch {
      // DB doesn't exist yet — return empty list
      return { status: 200, body: JSON.stringify([]) };
    }
  }

  // /api/projects/:id
  const projectMatch = pathname.match(/^\/api\/projects\/([^\/]+)$/);
  if (projectMatch) {
    try {
      const storage = new SqliteStorage();
      const project = storage.getProject(projectMatch[1]);
      storage.close();
      if (!project) {
        return { status: 404, body: JSON.stringify({ error: 'Project not found' }) };
      }
      return { status: 200, body: JSON.stringify(project) };
    } catch {
      return { status: 404, body: JSON.stringify({ error: 'Project not found' }) };
    }
  }

  // /api/projects/:id/files — diagnostic endpoint
  const filesMatch = pathname.match(/^\/api\/projects\/([^\/]+)\/files$/);
  if (filesMatch) {
    try {
      const storage = new SqliteStorage();
      const project = storage.getProject(filesMatch[1]) as { base_path: string; id: string } | null;
      storage.close();
      if (!project) {
        return { status: 404, body: JSON.stringify({ error: 'Project not found' }) };
      }
      const basePath = pathResolve(project.base_path);
      const expectedFiles = ['PROJECT_PLAN.md', 'ROADMAP.md', 'MINDMAP.md', 'ARCHITECTURE.md', 'AGENT_SETUP.md', '.planora/planora.json'];
      const result = expectedFiles.map((f) => {
        const fp = pathResolve(basePath, f);
        return { file: f, path: fp, exists: existsSync(fp) };
      });
      return { status: 200, body: JSON.stringify({ projectId: project.id, basePath, files: result }) };
    } catch {
      return { status: 500, body: JSON.stringify({ error: 'Server error' }) };
    }
  }

  // /api/projects/:id/file/:filename
  const fileMatch = pathname.match(/^\/api\/projects\/([^\/]+)\/file\/(.+)$/);
  if (fileMatch) {
    try {
      const storage = new SqliteStorage();
      const project = storage.getProject(fileMatch[1]) as { base_path: string; id: string; name: string } | null;
      storage.close();
      if (!project) {
        return { status: 404, body: JSON.stringify({ error: 'Project not found', projectId: fileMatch[1] }) };
      }

      const basePath = pathResolve(project.base_path);

      // Check if project directory exists
      if (!existsSync(basePath) || !statSync(basePath).isDirectory()) {
        return { status: 404, body: JSON.stringify({ error: 'Project directory not found', basePath, projectId: project.id }) };
      }

      // Decode URL-encoded characters BEFORE traversal check
      const requestedFile = decodeURIComponent(fileMatch[2]);
      const filePath = pathResolve(basePath, requestedFile);
      const relPath = relative(basePath, filePath);

      // Path traversal check: must stay inside basePath
      if (relPath.startsWith('..') || isAbsolute(relPath)) {
        return { status: 403, body: JSON.stringify({ error: 'Forbidden — path traversal detected', requestedFile }) };
      }

      if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
        return {
          status: 404,
          body: JSON.stringify({
            error: 'File not found',
            projectId: project.id,
            basePath,
            requestedFile,
            resolvedPath: filePath,
            hint: `Uruchom: planora plan -n "${project.name}" aby wygenerować pliki`,
          }),
        };
      }

      const content = readFileSync(filePath, 'utf-8');
      return { status: 200, body: content, headers: { 'Content-Type': getMimeType(filePath) } };
    } catch (err) {
      return { status: 500, body: JSON.stringify({ error: 'Server error', message: err instanceof Error ? err.message : String(err) }) };
    }
  }

  // /api/settings
  if (pathname === '/api/settings') {
    const settings = getSettings();
    return { status: 200, body: JSON.stringify(settings) };
  }

  return { status: 404, body: JSON.stringify({ error: 'Not found' }) };
}

export const webCommand = new Command('web')
  .description('Launch the Planora web dashboard')
  .option('-p, --port <number>', 'Port to listen on', '4173')
  .option('--dev', 'Run Vite dev server instead of serving built assets')
  .action((options: { port: string; dev?: boolean }) => {
    const port = parseInt(options.port, 10);

    if (options.dev) {
      const webPackageDir = dirname(resolveWebDist());
      console.log('\n🚀 Starting Planora web in DEV mode...');
      console.log(`   Vite dev server will start on http://localhost:${port}\n`);

      const child = spawn('npx', ['vite', '--port', String(port)], {
        cwd: webPackageDir,
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, PLANORA_DASHBOARD_DEV: '1' },
      });

      child.on('exit', (code) => {
        process.exit(code ?? 0);
      });
      return;
    }

    const distDir = resolveWebDist();
    const dashboardHtmlPath = join(distDir, 'dashboard.html');

    if (!existsSync(distDir)) {
      console.error(`\n❌ Error: Web app not built yet.`);
      console.error(`   Expected dist directory: ${distDir}`);
      console.error(`\n   To fix this, run:`);
      console.error(`   $ npm run build --workspace planora-web\n`);
      process.exit(1);
    }

    if (!existsSync(dashboardHtmlPath)) {
      console.error(`\n❌ Error: dashboard.html not found in dist directory.`);
      console.error(`   Expected: ${dashboardHtmlPath}\n`);
      process.exit(1);
    }

    const dashboardHtml = readFileSync(dashboardHtmlPath, 'utf-8');

    const server = createServer(async (req, res) => {
      const url = new URL(req.url || '/', `http://localhost:${port}`);
      const pathname = url.pathname;

      // API requests
      if (pathname.startsWith('/api/')) {
        try {
          const result = await handleApiRequest(pathname);
          res.writeHead(result.status, {
            'Content-Type': result.headers?.['Content-Type'] || 'application/json',
            ...result.headers,
          });
          res.end(result.body);
        } catch {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Server error' }));
        }
        return;
      }

      // Static files
      const filePath = pathResolve(join(distDir, pathname === '/' ? 'dashboard.html' : pathname));
      const relativePath = relative(pathResolve(distDir), filePath);

      if (relativePath.startsWith('..') || pathResolve(relativePath) === relativePath) {
        res.writeHead(403, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Forbidden' }));
        return;
      }

      if (existsSync(filePath) && statSync(filePath).isFile()) {
        const content = readFileSync(filePath);
        const mimeType = getMimeType(filePath);
        res.writeHead(200, { 'Content-Type': mimeType });
        res.end(content);
        return;
      }

      // SPA fallback for dashboard routes
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(dashboardHtml);
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
  });
