// ARCHITECTURE.md generator — Mermaid diagrams

import type { Generator } from './types.js';

export interface ArchitectureInput {
  projectName: string;
  description: string;
  stack: string;
}

export const architectureGenerator: Generator<ArchitectureInput> = {
  generate(input: ArchitectureInput): string {
    const stackList = input.stack.split(',').map((s) => s.trim());
    const hasFrontend = stackList.some((s) => /react|vue|angular|svelte|next/i.test(s));
    const hasBackend = stackList.some((s) => /node|express|fastify|nest/i.test(s));
    const hasDb = stackList.some((s) => /sqlite|postgres|mongo|supabase/i.test(s));

    let md = `# ${input.projectName} — Architecture\n\n`;
    md += `**Generated:** ${new Date().toISOString().split('T')[0]}\n\n---\n\n`;

    // System architecture diagram
    md += `## System Architecture\n\n`;
    md += '```mermaid\nflowchart TD\n';
    md += '    User[User]\n';
    if (hasFrontend) {
      md += '    User --> FE[Frontend]\n';
      md += '    FE --> API[API Layer]\n';
    } else {
      md += '    User --> API[API Layer]\n';
    }
    md += '    API --> Logic[Business Logic]\n';
    if (hasDb) {
      md += '    Logic --> DB[(Database)]\n';
    }
    md += '    Logic --> External[External Services]\n';
    md += `\n    style API fill:#4CAF50,stroke:#2E7D32,color:#fff\n`;
    md += '```\n\n';

    // Data flow
    md += `## Data Flow\n\n`;
    md += '```mermaid\nflowchart LR\n';
    md += '    A[Client Request] --> B[Router]\n';
    md += '    B --> C[Controller]\n';
    md += '    C --> D[Service]\n';
    md += '    D --> E[(Database)]\n';
    md += '    D --> F[Response]\n';
    md += '    F --> G[Client]\n';
    md += '```\n\n';

    // Component diagram
    md += `## Components\n\n`;
    md += '```mermaid\ngraph TD\n';
    md += `    App[${input.projectName}]\n`;
    if (hasFrontend) md += '    App --> UI[UI Components]\n';
    md += '    App --> Core[Core Logic]\n';
    md += '    Core --> Auth[Authentication]\n';
    md += '    Core --> Data[Data Access]\n';
    if (hasDb) md += '    Data --> DB[(Database)]\n';
    md += '```\n\n';

    // Component descriptions
    md += `## Component Descriptions\n\n`;
    md += `### API Layer\nHandles HTTP requests, routing, middleware. Input validation and response formatting.\n\n`;
    md += `### Business Logic\nCore domain logic. Services, use cases, business rules.\n\n`;
    if (hasDb) {
      md += `### Database\nData persistence. Models, migrations, queries.\n\n`;
    }
    md += `### External Services\nThird-party integrations, APIs, webhooks.\n`;

    return md;
  },
};
