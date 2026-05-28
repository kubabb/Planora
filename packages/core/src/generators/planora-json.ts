// planora.json generator

import type { Generator } from './types.js';

export interface PlanoraJsonInput {
  projectId: string;
  projectName: string;
  stack: string;
  timeline?: string;
  files: string[];
}

export const planoraJsonGenerator: Generator<PlanoraJsonInput> = {
  generate(input: PlanoraJsonInput): string {
    return JSON.stringify(
      {
        projectId: input.projectId,
        name: input.projectName,
        stack: input.stack.split(',').map((s) => s.trim()),
        timeline: input.timeline || null,
        files: input.files,
        agentReady: true,
        generated: new Date().toISOString(),
      },
      null,
      2,
    );
  },
};
