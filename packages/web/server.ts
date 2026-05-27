import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { homedir } from 'node:os';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const DIST_DIR = join(import.meta.dirname, 'dist');
const DB_PATH = join(homedir(), '.planora', 'planora.db');
const CONFIG_PATH = join(homedir(), '.planora', 'config.json');

function getMimeType(ext: string): string {
  return MIME_TYPES[ext] || 'application/octet-stream';
}

function handleApiRequest(pathname: string): Promise<{ status: number; body: string; headers?: Record<string, string> }> {
  // Dynamic import for better-sqlite3
  return import('better-sqlite3').then((module) => {
    const Database = module.default;

    if (pathname === '/api/projects') {
      const db = new Database(DB_PATH, { readonly: true });
      const stmt = db.prepare('SELECT * FROM projects ORDER BY updated_at DESC');
      const projects = stmt.all();
      db.close();
      return { status: 200, body: JSON.stringify(projects) };
    }

    const projectMatch = pathname.match(/^\/api\/projects\/([^\/]+)$/);
    if (projectMatch) {
      const db = new Database(DB_PATH, { readonly: true });
      const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
      const project = stmt.get(projectMatch[1]);
      db.close();
      if (!project) {
        return { status: 404, body: JSON.stringify({ error: 'Project not found' }) };
      }
      return { status: 200, body: JSON.stringify(project) };
    }

    const fileMatch = pathname.match(/^\/api\/projects\/([^\/]+)\/file\/(.+)$/);
    if (fileMatch) {
      const db = new Database(DB_PATH, { readonly: true });
      const stmt = db.prepare('SELECT base_path FROM projects WHERE id = ?');
      const project = stmt.get(fileMatch[1]) as { base_path: string } | undefined;
      db.close();

      if (!project) {
        return { status: 404, body: 'Project not found' };
      }

      const filePath = join(project.base_path, fileMatch[2]);
      if (!existsSync(filePath)) {
        return { status: 404, body: 'File not found' };
      }

      const content = readFileSync(filePath, 'utf-8');
      return { status: 200, body: content };
    }

    if (pathname === '/api/settings') {
      const config = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
      const maskedKey = config.apiKey ? '****' + config.apiKey.slice(-4) : '';
      
      return {
        status: 200,
        body: JSON.stringify({
          provider: config.provider,
          model: config.model,
          apiKey: maskedKey,
          databasePath: DB_PATH,
          qdrantUrl: config.qdrantUrl,
        }),
      };
    }

    return { status: 404, body: JSON.stringify({ error: 'Not found' }) };
  }).catch((err) => {
    console.error('API error:', err);
    return { status: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  });
}

const server = createServer(async (req, res) => {
  const url = req.url || '/';
  const pathname = url.split('?')[0];

  // Handle API requests
  if (pathname.startsWith('/api/')) {
    try {
      const result = await handleApiRequest(pathname);
      res.writeHead(result.status, {
        'Content-Type': 'application/json',
        ...result.headers,
      });
      res.end(result.body);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Server error' }));
    }
    return;
  }

  // Serve static files
  let filePath = join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);
  
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(DIST_DIR, 'index.html');
  }

  const ext = extname(filePath);
  const mimeType = getMimeType(ext);
  const content = readFileSync(filePath);

  res.writeHead(200, { 'Content-Type': mimeType });
  res.end(content);
});

const PORT = process.env.PORT || 4173;
server.listen(PORT, () => {
  console.log(`Planora web server running at http://localhost:${PORT}`);
});
