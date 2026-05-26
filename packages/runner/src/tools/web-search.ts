// web_search tool — SearXNG-based web search for the agent

import type { AgentToolDef } from './index.js';

let searxngUrl: string | null = null;
let lastCheck = 0;

async function getSearxngUrl(): Promise<string | null> {
  // Cache for 30 seconds
  if (searxngUrl && Date.now() - lastCheck < 30000) return searxngUrl;
  lastCheck = Date.now();

  // Check env var first
  if (process.env.SEARXNG_URL) {
    searxngUrl = process.env.SEARXNG_URL;
    return searxngUrl;
  }

  // Try default Docker location
  try {
    const res = await fetch('http://localhost:8888/search?q=test&format=json', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      searxngUrl = 'http://localhost:8888';
      return searxngUrl;
    }
  } catch { /* not running */ }

  return null;
}

export const webSearchTool: AgentToolDef = {
  schema: {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Wyszukaj w internecie. Użyj do researchu technologii, rozwiązań, dokumentacji.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Zapytanie wyszukiwania' },
          limit: { type: 'number', description: 'Liczba wyników (max 5)', default: 3 },
        },
        required: ['query'],
      },
    },
  },
  async execute({ query, limit }) {
    const baseUrl = await getSearxngUrl();
    if (!baseUrl) {
      // Fallback: duckduckgo lite HTML (no JS needed)
      return await fallbackDdgSearch(String(query), Number(limit || 3));
    }

    try {
      const url = `${baseUrl}/search?q=${encodeURIComponent(String(query))}&format=json&categories=general`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      const data = await res.json() as { results?: Array<{ title: string; url: string; content: string }> };

      if (!data.results?.length) return 'Brak wyników.';

      return data.results.slice(0, Number(limit || 3))
        .map((r) => `🔗 ${r.title}\n   ${r.url}\n   ${r.content?.slice(0, 200) || ''}`)
        .join('\n\n');
    } catch (error) {
      return await fallbackDdgSearch(String(query), Number(limit || 3));
    }
  },
};

async function fallbackDdgSearch(query: string, limit: number): Promise<string> {
  try {
    const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Planora/0.1 (dev-tool)' },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();

    // Extract result links from DDG Lite HTML
    const linkRegex = /<a[^>]*href="([^"]*uddg=([^"&]*))[^"]*"[^>]*class="result-link"[^>]*>([^<]*)<\/a>/gi;
    const snippetRegex = /<td[^>]*class="result-snippet"[^>]*>([^<]*)<\/td>/gi;

    const links: Array<{ title: string; url: string }> = [];
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const decoded = decodeURIComponent(match[2] || match[1]);
      links.push({ title: match[3].trim(), url: decoded });
      if (links.length >= limit) break;
    }

    if (links.length === 0) {
      // Simpler regex fallback
      const altRegex = /<a[^>]*href="([^"]*)"[^>]*class="result-link"[^>]*>([^<]*)<\/a>/gi;
      while ((match = altRegex.exec(html)) !== null) {
        links.push({ title: match[2].trim(), url: match[1] });
        if (links.length >= limit) break;
      }
    }

    if (links.length === 0) return 'Nie znaleziono wyników (DuckDuckGo fallback).';

    return links.map((l) => `🔗 ${l.title}\n   ${l.url}`).join('\n\n');
  } catch {
    return 'Wyszukiwanie niedostępne. SearXNG ani DuckDuckGo nie odpowiadają.';
  }
}
