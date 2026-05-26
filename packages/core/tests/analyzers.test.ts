// Analyzer tests

import { describe, it, expect, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { analyzeRepo, recommendStack, recommendFromExisting } from '../src/analyzers/index.js';
import type { DetectedStack } from '../src/analyzers/types.js';

describe('analyzeRepo', () => {
  const tmpRoot = path.join(os.tmpdir(), 'planora-analyzer-test-' + Date.now());

  function setup(files: Record<string, string>): string {
    const dir = path.join(tmpRoot, 'test-' + Math.random().toString(36).slice(2, 8));
    fs.mkdirSync(dir, { recursive: true });
    for (const [name, content] of Object.entries(files)) {
      const fullPath = path.join(dir, name);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, content, 'utf-8');
    }
    return dir;
  }

  afterAll(() => {
    try { fs.rmSync(tmpRoot, { recursive: true }); } catch { /* cleanup */ }
  });

  it('detects TypeScript + React project', () => {
    const dir = setup({
      'package.json': '{"name":"test"}',
      'package-lock.json': '{}',
      'tsconfig.json': '{}',
      'src/App.tsx': 'export default function App() {}',
      'src/index.ts': 'console.log("hi")',
      '.gitignore': 'node_modules',
      'README.md': '# Test',
    });

    const result = analyzeRepo(dir);
    expect(result.stack.language).toBe('TypeScript');
    expect(result.stack.framework).toBe('React');
    expect(result.stack.runtime).toBe('Node.js');
    expect(result.stack.packageManager).toBe('npm');
    expect(result.quality.hasTests).toBe(false);
    expect(result.quality.hasGitignore).toBe(true);
    expect(result.quality.hasReadme).toBe(true);
    expect(result.structure.totalFiles).toBeGreaterThanOrEqual(7);
  });

  it('detects quality issues in minimal project', () => {
    const dir = setup({
      'package.json': '{}',
      'src/index.ts': 'x',
    });

    const result = analyzeRepo(dir);
    expect(result.quality.hasGitignore).toBe(false);
    expect(result.quality.hasReadme).toBe(false);
    expect(result.quality.hasTests).toBe(false);
    expect(result.quality.score).toBeLessThan(50);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('detects vitest', () => {
    const dir = setup({
      'package.json': '{}',
      'tsconfig.json': '{}',
      'vitest.config.ts': 'export default {}',
      'src/index.ts': 'x',
      'src/index.test.ts': 'test("x", () => {})',
    });

    const result = analyzeRepo(dir);
    expect(result.stack.testing).toBe('Vitest');
    expect(result.quality.hasTests).toBe(true);
    expect(result.structure.testFiles).toBe(1);
  });
});

describe('recommendStack', () => {
  it('recommends CLI stack for tool description', () => {
    const rec = recommendStack('dev tool for project planning');
    expect(rec.language).toBe('TypeScript');
    expect(rec.framework).toContain('Commander');
  });

  it('recommends web stack for frontend description', () => {
    const rec = recommendStack('web app with react dashboard');
    expect(rec.framework).toContain('React');
    expect(rec.database).toContain('SQLite');
  });

  it('recommends fullstack for next.js description', () => {
    const rec = recommendStack('fullstack next.js app with ssr');
    expect(rec.framework).toBe('Next.js');
    expect(rec.database).toContain('PostgreSQL');
  });

  it('returns default for unknown description', () => {
    const rec = recommendStack('blah blah unknown');
    expect(rec.language).toBe('TypeScript');
  });
});

describe('recommendFromExisting', () => {
  it('recommends TypeScript for JS projects without it', () => {
    const stack: DetectedStack = {
      language: 'JavaScript', framework: null, runtime: 'Node.js',
      packageManager: 'npm', database: null, testing: null, tools: [],
    };
    const recs = recommendFromExisting(stack);
    expect(recs.some((r) => r.includes('TypeScript'))).toBe(true);
  });

  it('recommends testing framework when missing', () => {
    const stack: DetectedStack = {
      language: 'TypeScript', framework: 'React', runtime: 'Node.js',
      packageManager: 'npm', database: null, testing: null, tools: [],
    };
    const recs = recommendFromExisting(stack);
    expect(recs.some((r) => r.includes('test'))).toBe(true);
  });
});
