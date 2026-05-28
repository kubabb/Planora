// planora analyze — analyze existing repository and suggest improvements

import { Command } from 'commander';
import * as path from 'node:path';
import { analyzeRepo, recommendStack, recommendFromExisting } from 'planora-core';

export const analyzeCommand = new Command('analyze')
  .description('Analyze existing repository and suggest improvements')
  .option('-d, --dir <dir>', 'Directory to analyze', '.')
  .option('-r, --recommend <desc>', 'Project description for stack recommendation')
  .action(async (options) => {
    const dir = path.resolve(options.dir);
    console.log(`\n🔍 Analiza: ${dir}\n`);

    const analysis = analyzeRepo(dir);

    // Stack
    console.log('🔄 Wykryty stack:');
    console.log(`  Język:       ${analysis.stack.language}`);
    if (analysis.stack.framework) console.log(`  Framework:    ${analysis.stack.framework}`);
    if (analysis.stack.runtime) console.log(`  Runtime:      ${analysis.stack.runtime}`);
    if (analysis.stack.packageManager) console.log(`  Pkg manager:  ${analysis.stack.packageManager}`);
    if (analysis.stack.database) console.log(`  Baza danych:  ${analysis.stack.database}`);
    if (analysis.stack.testing) console.log(`  Testy:        ${analysis.stack.testing}`);
    if (analysis.stack.tools.length > 0) console.log(`  Narzędzia:    ${analysis.stack.tools.join(', ')}`);
    console.log('');

    // Stats
    console.log('📊 Statystyki:');
    console.log(`  Plików:       ${analysis.structure.totalFiles}`);
    console.log(`  Źródłowych:   ${analysis.structure.sourceFiles}`);
    console.log(`  Testowych:     ${analysis.structure.testFiles}`);
    console.log(`  Konfigów:     ${analysis.structure.configFiles}`);

    // Top 5 extensions
    const topExts = Object.entries(analysis.structure.languages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    if (topExts.length > 0) {
      console.log(`  Rozszerzenia: ${topExts.map(([e, n]) => `${e}(${n})`).join(' ')}`);
    }
    console.log('');

    // Quality
    console.log('⭐ Jakość projektu:');
    const q = analysis.quality;
    console.log(`  .gitignore:  ${q.hasGitignore ? '✅' : '❌'}`);
    console.log(`  README:      ${q.hasReadme ? '✅' : '❌'}`);
    console.log(`  Licencja:    ${q.hasLicense ? '✅' : '❌'}`);
    console.log(`  Testy:       ${q.hasTests ? '✅' : '❌'}`);
    console.log(`  CI/CD:       ${q.hasCI ? '✅' : '❌'}`);
    console.log(`  Linting:     ${q.hasLinting ? '✅' : '❌'}`);
    console.log(`  TypeCheck:   ${q.hasTypeChecking ? '✅' : '❌'}`);
    console.log(`  Score:       ${q.score}/100`);
    console.log('');

    // Recommendations
    const allRecs = [
      ...analysis.recommendations,
      ...recommendFromExisting(analysis.stack),
    ];

    if (allRecs.length > 0) {
      console.log('💡 Rekomendacje:');
      for (const rec of allRecs) {
        console.log(`  - ${rec}`);
      }
      console.log('');
    }

    // Stack recommendation
    if (options.recommend) {
      console.log('🔮 Rekomendowany stack:');
      const rec = recommendStack(options.recommend);
      console.log(`  Język:       ${rec.language}`);
      console.log(`  Framework:    ${rec.framework}`);
      console.log(`  Runtime:      ${rec.runtime}`);
      console.log(`  Baza danych:  ${rec.database}`);
      console.log(`  Narzędzia:    ${rec.tools.join(', ')}`);
      console.log(`  Dlaczego:     ${rec.reasoning}`);
      console.log('');
    } else {
      console.log('  💡 Użyj --recommend "opis" aby zobaczyć sugerowany stack\n');
    }
  });
