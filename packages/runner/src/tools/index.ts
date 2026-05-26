// Agent tool definitions — function-calling tools for Planora agent
// Each tool has: name, description, JSON Schema parameters, and execute()

import type { AiTool } from '@planora/core';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

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

// ─── registry ─────────────────────────────────────────

export const ALL_TOOLS: AgentToolDef[] = [
  fileReadTool,
  fileWriteTool,
  fileListTool,
];

export function getToolSchemas(): AiTool[] {
  return ALL_TOOLS.map((t) => t.schema);
}

export function getTool(name: string): AgentToolDef | undefined {
  return ALL_TOOLS.find((t) => t.schema.function.name === name);
}
