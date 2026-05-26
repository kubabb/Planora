// planora analyze — analyze existing repository

import { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';

export const analyzeCommand = new Command('analyze')
  .description('Analyze existing repository and suggest improvements')
  .option('-d, --dir <dir>', 'Directory to analyze', '.')
  .action(async (options) => {
    const dir = path.resolve(options.dir);
    console.log(`\n🔍 Analiza: ${dir}\n`);

    // Detect package.json
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      console.log('📦 package.json:');
      console.log(`  Name:        ${pkg.name || '(brak)'}`);
      console.log(`  Type:        ${pkg.type || 'commonjs'}`);
      console.log(`  Dependencies: ${Object.keys(pkg.dependencies || {}).length}`);
      console.log(`  DevDeps:     ${Object.keys(pkg.devDependencies || {}).length}`);
      console.log('');
    }

    // Detect stack
    const allFiles = walkDir(dir, 2);
    const hasTypeScript = allFiles.some((f) => f.endsWith('.ts') || f.endsWith('.tsx'));
    const hasReact = allFiles.some((f) => f.endsWith('.jsx') || f.endsWith('.tsx'));
    const hasVue = allFiles.some((f) => f.endsWith('.vue'));
    const hasPython = allFiles.some((f) => f.endsWith('.py'));
    const hasGo = allFiles.some((f) => f.endsWith('.go'));
    const hasDocker = fs.existsSync(path.join(dir, 'Dockerfile'));
    const hasGit = fs.existsSync(path.join(dir, '.git'));

    console.log('🔧 Detected stack:');
    if (hasTypeScript) console.log('  ✓ TypeScript');
    if (hasReact) console.log('  ✓ React');
    if (hasVue) console.log('  ✓ Vue');
    if (hasPython) console.log('  ✓ Python');
    if (hasGo) console.log('  ✓ Go');
    if (hasDocker) console.log('  ✓ Docker');
    if (hasGit) console.log('  ✓ Git');
    console.log('');

    // Recommendations
    console.log('💡 Rekomendacje:');
    if (!hasGit) console.log('  - Rozważ inicjalizację git: git init');
    if (hasTypeScript && !fs.existsSync(path.join(dir, 'tsconfig.json'))) {
      console.log('  - Brak tsconfig.json — dodaj konfigurację TypeScript');
    }
    if (!fs.existsSync(path.join(dir, '.gitignore'))) {
      console.log('  - Brak .gitignore — dodaj node_modules/, dist/, .env');
    }
    console.log('');
  });

function walkDir(dir: string, maxDepth: number, depth = 0): string[] {
  if (depth > maxDepth) return [];
  const results: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        results.push(...walkDir(full, maxDepth, depth + 1));
      } else {
        results.push(full);
      }
    }
  } catch { /* permission denied */ }
  return results;
}
