// AGENT_SETUP.md generator

import type { Generator } from './types.js';

export interface AgentSetupInput {
  projectName: string;
  provider: string;
  model: string;
}

export const agentSetupGenerator: Generator<AgentSetupInput> = {
  generate(input: AgentSetupInput): string {
    return `# ${input.projectName} — Agent Setup

## AI Configuration

- **Provider:** ${input.provider}
- **Model:** ${input.model}
- **Config:** ~/.planora/config.json

## Workflows

### plan
Generates project plan, mindmap, and architecture docs.

Trigger: \`planora plan --ai\`

### code (coming soon)
Implements features based on project plan.

Trigger: \`planora agent code --feature "..."\`

### review (coming soon)
Reviews code for quality and correctness.

Trigger: \`planora agent review\`

## Tool Registry

| Tool | Description |
|------|-------------|
| file_read | Read file contents |
| file_write | Write content to file |
| file_list | List directory contents |
| web_search | Search the web (SearXNG) |

## Run History

Run history is stored in SQLite. View with:
\`\`\`
planora agent --history
\`\`\`

## Configuration File

\`\`\`json
{
  "provider": "${input.provider}",
  "model": "${input.model}",
  "configPath": "~/.planora/config.json"
}
\`\`\`
`;
  },
};
