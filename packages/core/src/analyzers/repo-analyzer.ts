// Repo analyzer — scans a directory and detects stack, structure, quality

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { RepoAnalysis, DetectedStack, FileStats, QualityIndicators } from './types.js';

export function analyzeRepo(dir: string): RepoAnalysis {
  const resolvedDir = path.resolve(dir);
  const name = path.basename(resolvedDir);

  const allFiles = walkDir(resolvedDir, 4, new Set(['node_modules', '.git', 'dist', '.planora', '.next', 'build', 'target']));
  const filesByExt = groupByExtension(allFiles);

  const stack = detectStack(resolvedDir, allFiles, filesByExt);
  const structure = computeStats(allFiles, filesByExt);
  const quality = assessQuality(resolvedDir, allFiles);
  const recommendations = generateRecommendations(stack, structure, quality);

  return { name, path: resolvedDir, stack, structure, quality, recommendations };
}

function walkDir(dir: string, maxDepth: number, skip: Set<string>, depth = 0): string[] {
  if (depth > maxDepth) return [];
  const results: string[] = [];
  try {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        results.push(...walkDir(full, maxDepth, skip, depth + 1));
      } else {
        results.push(full);
      }
    }
  } catch { /* permissions */ }
  return results;
}

function groupByExtension(files: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const f of files) {
    const ext = path.extname(f).toLowerCase() || '(none)';
    map[ext] = (map[ext] || 0) + 1;
  }
  return map;
}

function detectStack(dir: string, files: string[], byExt: Record<string, number>): DetectedStack {
  const fileNames = new Set(files.map((f) => path.basename(f).toLowerCase()));
  const allExts = Object.keys(byExt);
  const allNames = files.map((f) => f.toLowerCase());

  // Language
  let language = 'unknown';
  if (byExt['.ts'] || byExt['.tsx']) language = 'TypeScript';
  else if (byExt['.js'] || byExt['.jsx']) language = 'JavaScript';
  else if (byExt['.py']) language = 'Python';
  else if (byExt['.go']) language = 'Go';
  else if (byExt['.rs']) language = 'Rust';
  else if (byExt['.java']) language = 'Java';

  // Framework
  let framework: string | null = null;
  if (fileNames.has('next.config.js') || fileNames.has('next.config.ts') || fileNames.has('next.config.mjs')) framework = 'Next.js';
  else if (byExt['.tsx'] || byExt['.jsx']) framework = 'React';
  else if (byExt['.vue']) framework = 'Vue';
  else if (byExt['.svelte']) framework = 'Svelte';
  else if (allNames.some((f) => f.includes('/api/') && (f.endsWith('.ts') || f.endsWith('.py')))) framework = 'REST API';
  else if (fileNames.has('cargo.toml')) framework = 'Rust/Cargo';
  else if (fileNames.has('go.mod')) framework = 'Go module';

  // Runtime
  let runtime: string | null = null;
  if (fileNames.has('package.json')) runtime = 'Node.js';
  else if (fileNames.has('requirements.txt') || fileNames.has('pyproject.toml')) runtime = 'Python';
  else if (fileNames.has('deno.json')) runtime = 'Deno';
  else if (fileNames.has('bun.lockb')) runtime = 'Bun';

  // Package manager
  let packageManager: string | null = null;
  if (fileNames.has('package-lock.json')) packageManager = 'npm';
  else if (fileNames.has('yarn.lock')) packageManager = 'yarn';
  else if (fileNames.has('pnpm-lock.yaml')) packageManager = 'pnpm';
  else if (fileNames.has('bun.lockb')) packageManager = 'bun';

  // Database
  let database: string | null = null;
  if (allNames.some((f) => f.includes('prisma/'))) database = 'Prisma';
  else if (allNames.some((f) => f.includes('drizzle/'))) database = 'Drizzle';
  else if (allNames.some((f) => f.includes('.sql') || f.endsWith('.sqlite'))) database = 'SQLite';
  else if (fileNames.has('supabase') || allNames.some((f) => f.includes('supabase'))) database = 'Supabase';

  // Testing
  let testing: string | null = null;
  if (fileNames.has('vitest.config.ts') || fileNames.has('vitest.config.js')) testing = 'Vitest';
  else if (fileNames.has('jest.config.ts') || fileNames.has('jest.config.js')) testing = 'Jest';
  else if (allNames.some((f) => f.includes('.test.') || f.includes('.spec.'))) testing = 'unknown (tests found)';
  else if (fileNames.has('pytest.ini') || fileNames.has('conftest.py')) testing = 'Pytest';

  // Tools
  const tools: string[] = [];
  if (fileNames.has('tsconfig.json')) tools.push('TypeScript');
  if (fileNames.has('eslint.config.js') || fileNames.has('eslint.config.mjs') || fileNames.has('.eslintrc')) tools.push('ESLint');
  if (fileNames.has('.prettierrc') || fileNames.has('prettier.config.js')) tools.push('Prettier');
  if (fileNames.has('dockerfile') || fileNames.has('docker-compose.yml') || fileNames.has('docker-compose.yaml')) tools.push('Docker');
  if (allNames.some((f) => f.includes('.github/workflows/'))) tools.push('GitHub Actions');

  return { language, framework, runtime, packageManager, database, testing, tools };
}

function computeStats(files: string[], byExt: Record<string, number>): FileStats {
  const totalFiles = files.length;
  const sourceExts = new Set(['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.vue', '.svelte']);
  const testPatterns = ['.test.', '.spec.', 'test_', '_test.', '__tests__'];

  let sourceFiles = 0;
  let testFiles = 0;
  let configFiles = 0;

  for (const f of files) {
    const ext = path.extname(f).toLowerCase();
    const base = path.basename(f).toLowerCase();
    const full = f.toLowerCase();

    if (testPatterns.some((p) => full.includes(p))) {
      testFiles++;
    } else if (sourceExts.has(ext)) {
      sourceFiles++;
    } else if (['.json', '.yaml', '.yml', '.toml', '.cfg', '.ini', '.config.js', '.config.ts', '.config.mjs'].some((e) => base.endsWith(e))) {
      configFiles++;
    }
  }

  return {
    totalFiles,
    sourceFiles,
    testFiles,
    configFiles,
    languages: byExt,
  };
}

function assessQuality(dir: string, files: string[]): QualityIndicators {
  const names = new Set(files.map((f) => path.basename(f).toLowerCase()));
  const allNames = files.map((f) => f.toLowerCase());

  const hasGitignore = names.has('.gitignore');
  const hasReadme = names.has('readme.md') || names.has('readme');
  const hasLicense = names.has('license') || names.has('license.md');
  const hasTests = files.some((f) => {
    const lower = f.toLowerCase();
    return lower.includes('.test.') || lower.includes('.spec.') || lower.includes('__tests__') || lower.includes('test_') || lower.includes('_test');
  });
  const hasCI = allNames.some((f) => f.includes('.github/workflows/') || f.includes('.gitlab-ci.yml'));
  const hasLinting = names.has('eslint.config.js') || names.has('eslint.config.mjs') || names.has('.eslintrc.json');
  const hasTypeChecking = names.has('tsconfig.json');

  // Quality score
  let score = 0;
  if (hasGitignore) score += 15;
  if (hasReadme) score += 15;
  if (hasLicense) score += 10;
  if (hasTests) score += 20;
  if (hasCI) score += 15;
  if (hasLinting) score += 10;
  if (hasTypeChecking) score += 15;

  return { hasGitignore, hasReadme, hasLicense, hasTests, hasCI, hasLinting, hasTypeChecking, score };
}

function generateRecommendations(
  stack: DetectedStack,
  structure: FileStats,
  quality: QualityIndicators,
): string[] {
  const recs: string[] = [];

  if (!quality.hasGitignore) recs.push('Dodaj .gitignore (node_modules/, dist/, .env)');
  if (!quality.hasReadme) recs.push('Dodaj README.md z opisem projektu');
  if (!quality.hasLicense) recs.push('Rozważ dodanie licencji (MIT, Apache 2.0)');
  if (!quality.hasTests) recs.push('Brak testów — dodaj vitest/jest/pytest');
  if (!quality.hasCI) recs.push('Skonfiguruj CI (GitHub Actions)');
  if (!quality.hasLinting && stack.language === 'TypeScript') recs.push('Dodaj ESLint + Prettier');
  if (!quality.hasTypeChecking && (stack.language === 'TypeScript' || stack.language === 'JavaScript')) {
    recs.push('Dodaj tsconfig.json dla type-checkingu');
  }
  if (structure.testFiles === 0 && structure.sourceFiles > 0) {
    recs.push(`Masz ${structure.sourceFiles} plików źródłowych i zero testów`);
  }

  return recs;
}
