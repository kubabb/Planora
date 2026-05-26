// Agent tool definitions — function-calling tools for Planora agent
// Each tool has: name, description, JSON Schema parameters, and execute()

import type { AiTool } from '@planora/core';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { exec } from 'node:child_process';

export interface AgentToolDef {
  schema: AiTool;
  execute(args: Record<string, unknown>): Promise<string>;
}

// ─── file_read ────────────────────────────────────────

const fileReadTool: AgentToolDef = {
  schema: {
    type: 'function',
    function: {
      name: 'file_read',
      description: 'Odczytaj zawartość pliku z podanej ścieżki',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Ścieżka do pliku' },
        },
        required: ['path'],
      },
    },
  },
  async execute({ path: filePath }) {
    try {
      const content = await fs.readFile(String(filePath), 'utf-8');
      return content;
    } catch (error) {
      return `Błąd odczytu pliku: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
};

// ─── file_write ───────────────────────────────────────

const fileWriteTool: AgentToolDef = {
  schema: {
    type: 'function',
    function: {
      name: 'file_write',
      description: 'Zapisz zawartość do pliku. Tworzy katalogi nadrzędne jeśli potrzeba.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Ścieżka do pliku' },
          content: { type: 'string', description: 'Zawartość pliku' },
        },
        required: ['path', 'content'],
      },
    },
  },
  async execute({ path: filePath, content }) {
    try {
      const dir = path.dirname(String(filePath));
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(String(filePath), String(content), 'utf-8');
      return `Plik zapisany: ${filePath}`;
    } catch (error) {
      return `Błąd zapisu pliku: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
};

// ─── file_list ────────────────────────────────────────

const fileListTool: AgentToolDef = {
  schema: {
    type: 'function',
    function: {
      name: 'file_list',
      description: 'Listuj pliki w katalogu',
      parameters: {
        type: 'object',
        properties: {
          directory: { type: 'string', description: 'Ścieżka do katalogu' },
        },
        required: ['directory'],
      },
    },
  },
  async execute({ directory }) {
    try {
      const entries = await fs.readdir(String(directory), { withFileTypes: true });
      return entries
        .map((e) => `${e.isDirectory() ? '📁' : '📄'} ${e.name}`)
        .join('\n');
    } catch (error) {
      return `Błąd listowania: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
};

// ─── search ─────────────────────────────────────────

const searchTool: AgentToolDef = {
  schema: {
    type: 'function',
    function: {
      name: 'search',
      description: 'Szukaj tekstu w plikach (ripgrep-style)',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Wzorzec do wyszukania (regex)' },
          directory: { type: 'string', description: 'Katalog do przeszukania' },
          fileGlob: { type: 'string', description: 'Filtr plików np. *.ts' },
        },
        required: ['pattern', 'directory'],
      },
    },
  },
  async execute({ pattern, directory, fileGlob }) {
    try {
      const results: string[] = [];
      await walkAndSearch(String(directory), String(pattern), String(fileGlob || ''), results);
      return results.slice(0, 50).join('\n') || 'Nic nie znaleziono';
    } catch (error) {
      return `Błąd wyszukiwania: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
};

async function walkAndSearch(
  dir: string, pattern: string, glob: string, results: string[],
): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'dist') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      await walkAndSearch(full, pattern, glob, results);
      continue;
    }
    if (glob && !e.name.endsWith(glob)) continue;
    try {
      const content = await fs.readFile(full, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(pattern)) {
          results.push(`${full}:${i + 1}: ${lines[i].trim().slice(0, 120)}`);
        }
      }
    } catch { /* skip binary/encoding errors */ }
  }
}

// ─── shell ───────────────────────────────────────────

const shellTool: AgentToolDef = {
  schema: {
    type: 'function',
    function: {
      name: 'shell',
      description: 'Wykonaj komendę w shellu. Zwraca stdout (max 4000 znaków). Bezpieczne: ls, cat, grep, npm test, tsc, git.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Komenda do wykonania' },
          workdir: { type: 'string', description: 'Katalog roboczy' },
        },
        required: ['command'],
      },
    },
  },
  async execute({ command, workdir }) {
    return new Promise<string>((resolve) => {
      const opts = { cwd: String(workdir || '.'), timeout: 30000, maxBuffer: 8 * 1024 * 1024 };
      exec(String(command), opts, (error, stdout, stderr) => {
        const out = (stdout + (stderr ? `\n[stderr]\n${stderr}` : '')).slice(0, 4000);
        if (error) {
          resolve(`exit=${error.code || 1}\n${out}`);
        } else {
          resolve(out || '(brak outputu)');
        }
      });
    });
  },
};

// ─── registry ─────────────────────────────────────────

export const ALL_TOOLS: AgentToolDef[] = [
  fileReadTool,
  fileWriteTool,
  fileListTool,
  searchTool,
  shellTool,
];

export function getToolSchemas(): AiTool[] {
  return ALL_TOOLS.map((t) => t.schema);
}

export function getTool(name: string): AgentToolDef | undefined {
  return ALL_TOOLS.find((t) => t.schema.function.name === name);
}
