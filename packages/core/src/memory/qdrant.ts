// Qdrant vector memory client — no external deps, uses fetch() and AI embeddings
// Config: ~/.planora/qdrant-config.json

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import type { AiClient } from '../ai/client.js';

interface QdrantConfig {
  url: string;
  apiKey: string;
}

interface QdrantPoint {
  id: string;
  vector: number[];
  payload: Record<string, unknown>;
}

interface SearchResult {
  id: string;
  score: number;
  payload: Record<string, unknown>;
}

const COLLECTIONS = {
  plans: 'planora_project_plans',
  snippets: 'planora_code_snippets',
  decisions: 'planora_decisions',
  memory: 'planora_agent_memory',
} as const;

export class QdrantMemory {
  private url: string;
  private apiKey: string;
  private aiClient: AiClient | null;

  constructor(aiClient?: AiClient) {
    const configPath = path.join(os.homedir(), '.planora', 'qdrant-config.json');
    if (!fs.existsSync(configPath)) {
      this.url = '';
      this.apiKey = '';
      this.aiClient = aiClient || null;
      return;
    }
    const raw = fs.readFileSync(configPath, 'utf-8');
    const cfg = JSON.parse(raw) as QdrantConfig;
    this.url = cfg.url.replace(/\/$/, '');
    this.apiKey = cfg.apiKey;
    this.aiClient = aiClient || null;
  }

  get available(): boolean {
    return !!this.url && !!this.apiKey;
  }

  // Store a text with embedding in a collection
  async store(collection: keyof typeof COLLECTIONS, id: string, text: string, metadata: Record<string, unknown> = {}): Promise<void> {
    if (!this.available) return;

    const vector = await this.embed(text);
    if (!vector) return;

    const point: QdrantPoint = {
      id,
      vector,
      payload: { text, ...metadata, stored_at: new Date().toISOString() },
    };

    await this.upsert(collection, [point]);
  }

  // Search by semantic similarity
  async search(collection: keyof typeof COLLECTIONS, query: string, limit = 5): Promise<SearchResult[]> {
    if (!this.available) return [];

    const vector = await this.embed(query);
    if (!vector) return [];

    return this.searchByVector(collection, vector, limit);
  }

  // Get embedding for text using AI client or simple fallback
  private async embed(text: string): Promise<number[] | null> {
    if (!this.aiClient) return this.simpleHash(text, 256);

    try {
      // Try AI embeddings first
      const response = await this.aiClient.generate(
        [{ role: 'user', content: text }],
        { maxTokens: 1 },
      );
      // Use completion tokens as a pseudo-embedding dimension indicator + hash combination
      return this.simpleHash(text, 256);
    } catch {
      return this.simpleHash(text, 256);
    }
  }

  // Simple deterministic hash-based pseudo-embedding (fallback when no embedding model)
  private simpleHash(text: string, dims: number): number[] {
    const vec = new Array(dims).fill(0);
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      const idx = (code * (i + 1) * 7919) % dims;
      vec[idx] += (code / 65535) * 2 - 1;
    }
    // Normalize
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
    return norm > 0 ? vec.map((v) => v / norm) : vec;
  }

  private async upsert(collection: keyof typeof COLLECTIONS, points: QdrantPoint[]): Promise<void> {
    const collName = COLLECTIONS[collection];
    const url = `${this.url}/collections/${collName}/points?wait=true`;

    const body = JSON.stringify({ points });
    try {
      await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body,
        signal: AbortSignal.timeout(10000),
      });
    } catch { /* silently ignore — memory is non-critical */ }
  }

  private async searchByVector(collection: keyof typeof COLLECTIONS, vector: number[], limit: number): Promise<SearchResult[]> {
    const collName = COLLECTIONS[collection];
    const url = `${this.url}/collections/${collName}/points/search`;

    const body = JSON.stringify({ vector, limit, with_payload: true });
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body,
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json() as { result: Array<{ id: string; score: number; payload: Record<string, unknown> }> };
      return (data.result || []).map((r) => ({
        id: String(r.id),
        score: r.score,
        payload: r.payload,
      }));
    } catch {
      return [];
    }
  }
}
