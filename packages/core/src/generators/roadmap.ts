// ROADMAP.md generator

import type { Generator } from './types.js';

export interface RoadmapInput {
  projectName: string;
  phases?: number;
  timeline?: string;
}

export const roadmapGenerator: Generator<RoadmapInput> = {
  generate(input: RoadmapInput): string {
    const phases = input.phases || 4;
    const phaseNames = ['Foundation', 'Core Development', 'Advanced Features', 'Polish & Launch'];

    let md = `# ${input.projectName} — Roadmap\n\n`;
    md += `**Generated:** ${new Date().toISOString().split('T')[0]}\n`;
    if (input.timeline) {
      md += `**Available Time:** ${input.timeline}\n`;
    }
    md += `\n---\n\n`;

    for (let i = 0; i < phases; i++) {
      const q = `Q${i + 1}`;
      const name = phaseNames[i] || `Phase ${i + 1}`;
      md += `## ${q}: ${name}\n\n`;
      md += `**Timeline:** Week ${i * 6 + 1}-${(i + 1) * 6}\n\n`;
      md += `### Features\n\n- [ ] Feature ${i + 1}.1\n- [ ] Feature ${i + 1}.2\n- [ ] Feature ${i + 1}.3\n\n`;
      md += `### Dependencies\n\n- Dep ${i + 1}.1\n- Dep ${i + 1}.2\n\n`;
      md += `### Status: 🟡 Planned\n\n---\n\n`;
    }
    return md;
  },
};
