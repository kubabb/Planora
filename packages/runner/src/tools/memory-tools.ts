// memory tools — Qdrant-based semantic memory for the agent

import type { AgentToolDef } from './index.js';
import { QdrantMemory } from '@planora/core';

// Singleton — initialized on first use
let memory: QdrantMemory | null = null;

function getMemory(): QdrantMemory {
  if (!memory) {
    memory = new QdrantMemory(undefined);
  }
  return memory;
}

export const memoryStoreTool: AgentToolDef = {
  schema: {
    type: 'function',
    function: {
      name: 'memory_store',
      description: 'Zapisz informację w pamięci semantycznej agenta (Qdrant). Użyj dla ważnych decyzji, wzorców, wniosków.',
      parameters: {
        type: 'object',
        properties: {
          collection: {
            type: 'string',
            enum: ['plans', 'snippets', 'decisions', 'memory'],
            description: 'Kolekcja: plans (plany projektu), snippets (kod), decisions (decyzje), memory (ogólne)',
          },
          id: { type: 'string', description: 'Unikalny identyfikator (np. nazwa-funkcji-1)' },
          content: { type: 'string', description: 'Treść do zapisania' },
        },
        required: ['collection', 'id', 'content'],
      },
    },
  },
  async execute({ collection, id, content }) {
    const mem = getMemory();
    if (!mem.available) return 'Qdrant niedostępny — pamięć wyłączona.';
    await mem.store(collection as 'plans' | 'snippets' | 'decisions' | 'memory', String(id), String(content));
    return `✓ Zapisano w pamięci (${collection}/${id})`;
  },
};

export const memorySearchTool: AgentToolDef = {
  schema: {
    type: 'function',
    function: {
      name: 'memory_search',
      description: 'Szukaj w pamięci semantycznej agenta. Użyj aby znaleźć podobne plany, decyzje, lub wzorce z przeszłości.',
      parameters: {
        type: 'object',
        properties: {
          collection: {
            type: 'string',
            enum: ['plans', 'snippets', 'decisions', 'memory'],
            description: 'Kolekcja do przeszukania',
          },
          query: { type: 'string', description: 'Zapytanie semantyczne' },
          limit: { type: 'number', description: 'Liczba wyników (max 5)', default: 3 },
        },
        required: ['collection', 'query'],
      },
    },
  },
  async execute({ collection, query, limit }) {
    const mem = getMemory();
    if (!mem.available) return 'Qdrant niedostępny.';
    const results = await mem.search(collection as 'plans' | 'snippets' | 'decisions' | 'memory', String(query), Number(limit || 3));
    if (results.length === 0) return 'Nic nie znaleziono w pamięci.';
    return results.map((r) => `📌 [${r.score.toFixed(2)}] ${(r.payload.text as string)?.slice(0, 200)}`).join('\n\n');
  },
};
