// SQLite storage adapter using better-sqlite3

import Database from 'better-sqlite3';
import type { StorageAdapter } from './adapter.js';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';

const DB_PATH = path.join(os.homedir(), '.planora', 'planora.db');

export class SqliteStorage implements StorageAdapter {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const p = dbPath || DB_PATH;
    const dir = path.dirname(p);
    // Ensure directory exists (synchronous, no await needed)
    fs.mkdirSync(dir, { recursive: true });
    this.db = new Database(p);
    this.db.pragma('journal_mode = WAL');
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT,
        profile TEXT NOT NULL DEFAULT 'local',
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        user_id TEXT NOT NULL,
        stack TEXT NOT NULL DEFAULT '[]',
        base_path TEXT NOT NULL DEFAULT '.',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS agent_runs (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        workflow TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        output TEXT NOT NULL DEFAULT '',
        error TEXT,
        steps_used INTEGER NOT NULL DEFAULT 0,
        tokens_used INTEGER NOT NULL DEFAULT 0,
        started_at TEXT NOT NULL,
        finished_at TEXT,
        FOREIGN KEY (project_id) REFERENCES projects(id)
      );
    `);
  }

  // ─── Users ────────────────────────────────────────

  createUser(user: { id: string; name: string; email?: string; profile?: string }): void {
    this.db.prepare(
      'INSERT OR IGNORE INTO users (id, name, email, profile) VALUES (?, ?, ?, ?)',
    ).run(user.id, user.name, user.email || null, user.profile || 'local');
  }

  getUser(id: string): unknown | null {
    return this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) || null;
  }

  // ─── Projects ─────────────────────────────────────

  createProject(project: {
    id: string;
    name: string;
    description: string;
    userId: string;
    stack: string;
    basePath?: string;
  }): void {
    this.db.prepare(
      'INSERT INTO projects (id, name, description, user_id, stack, base_path) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(project.id, project.name, project.description, project.userId, project.stack, project.basePath || '.');
  }

  getProject(id: string): unknown | null {
    return this.db.prepare('SELECT * FROM projects WHERE id = ?').get(id) || null;
  }

  listProjects(userId?: string): unknown[] {
    if (userId) {
      return this.db.prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC').all(userId);
    }
    return this.db.prepare('SELECT * FROM projects ORDER BY updated_at DESC').all();
  }

  // ─── Agent Runs ───────────────────────────────────

  createRun(run: {
    id: string;
    projectId: string;
    workflow: string;
    status: string;
    output: string;
    stepsUsed: number;
    tokensUsed: number;
    startedAt: string;
    finishedAt?: string;
    error?: string;
  }): void {
    this.db.prepare(
      `INSERT INTO agent_runs (id, project_id, workflow, status, output, error, steps_used, tokens_used, started_at, finished_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      run.id, run.projectId, run.workflow, run.status, run.output,
      run.error || null, run.stepsUsed, run.tokensUsed, run.startedAt, run.finishedAt || null,
    );
  }

  updateRun(id: string, update: {
    status?: string;
    output?: string;
    stepsUsed?: number;
    tokensUsed?: number;
    finishedAt?: string;
    error?: string;
  }): void {
    const sets: string[] = [];
    const params: unknown[] = [];

    if (update.status !== undefined) { sets.push('status = ?'); params.push(update.status); }
    if (update.output !== undefined) { sets.push('output = ?'); params.push(update.output); }
    if (update.stepsUsed !== undefined) { sets.push('steps_used = ?'); params.push(update.stepsUsed); }
    if (update.tokensUsed !== undefined) { sets.push('tokens_used = ?'); params.push(update.tokensUsed); }
    if (update.finishedAt !== undefined) { sets.push('finished_at = ?'); params.push(update.finishedAt); }
    if (update.error !== undefined) { sets.push('error = ?'); params.push(update.error); }

    if (sets.length === 0) return;

    params.push(id);
    this.db.prepare(`UPDATE agent_runs SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  }

  listRuns(projectId: string): unknown[] {
    return this.db.prepare(
      'SELECT * FROM agent_runs WHERE project_id = ? ORDER BY started_at DESC LIMIT 50',
    ).all(projectId);
  }

  // ─── Cleanup ──────────────────────────────────────

  close(): void {
    this.db.close();
  }
}
