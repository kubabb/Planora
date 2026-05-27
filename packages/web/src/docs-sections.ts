export type DocSection = {
  id: string;
  title: string;
  body: string;
  code?: string[];
  items?: [string, string][];
};

export const sections: DocSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    body: 'Planora is a markdown-first planning tool for software teams. It turns project context into structured plans, mind maps, architecture diagrams, and a local dashboard. No external services required.',
  },
  {
    id: 'installation',
    title: 'Installation',
    body: 'Two installation paths are available depending on your setup.',
    code: [
      '# Local development (current)',
      'git clone https://github.com/kubabb/Planora.git',
      'cd Planora',
      'npm install',
      'npm run build',
      '',
      '# Optional: link CLI for testing',
      'npm link --workspace @planora/cli',
      'planora --help',
      '',
      '# Global install (coming soon)',
      '# npm install -g planora',
    ],
  },
  {
    id: 'requirements',
    title: 'Requirements',
    body: 'Planora runs locally on your machine with minimal dependencies.',
    items: [
      ['Node.js', '20 or higher'],
      ['npm', '9 or higher'],
      ['API key', 'OpenRouter (recommended), OpenAI, Ollama, or compatible provider'],
    ],
  },
  {
    id: 'quick-start',
    title: 'Quick Start',
    body: 'Four commands to generate your first planning pack.',
    code: [
      'planora config',
      'planora init --name "my-app" --stack "react,node,postgres"',
      'planora plan --ai',
      'planora web',
    ],
  },
  {
    id: 'configuration',
    title: 'Configuration',
    body: 'Run planora config to set up your AI provider. The wizard guides you through provider selection, API key entry, and model choice. Configuration is stored locally at ~/.planora/config.json and never sent to third parties.',
    items: [
      ['Providers', 'OpenRouter (recommended), OpenAI, Ollama, OpenCode, custom OpenAI-compatible'],
      ['Config location', '~/.planora/config.json'],
      ['Security', 'chmod 600, never committed to git'],
    ],
  },
  {
    id: 'commands',
    title: 'CLI Commands',
    body: 'All available commands and their purpose.',
    items: [
      ['planora config', 'configure AI provider and model'],
      ['planora init', 'create a new project workspace'],
      ['planora plan --ai', 'generate planning documents with AI assistance'],
      ['planora analyze', 'analyze repository structure and tech stack'],
      ['planora roadmap', 'generate phased development timeline'],
      ['planora mindmap', 'generate hierarchical outline for mind map rendering'],
      ['planora review', 'review generated plans with AI feedback'],
      ['planora code', 'execute code generation tasks'],
      ['planora agent', 'run agent workflows (plan, code, review)'],
      ['planora web', 'open the local dashboard on localhost:4173'],
    ],
  },
  {
    id: 'generated-files',
    title: 'Generated Files',
    body: 'Markdown is the source of truth. Every generated artifact is git-friendly and readable in plain text.',
    items: [
      ['PROJECT_PLAN.md', 'overview, goals, MVP, stack, milestones'],
      ['ROADMAP.md', 'phased delivery plan and sequencing'],
      ['MINDMAP.md', 'hierarchical outline for markmap rendering'],
      ['ARCHITECTURE.md', 'Mermaid-based system and data-flow diagrams'],
      ['AGENT_SETUP.md', 'provider, model, and workflow notes'],
      ['planora.json', 'project metadata and machine-readable settings'],
    ],
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    body: 'Run planora web to open the local dashboard at localhost:4173. The dashboard lists all projects, renders markdown plans, displays interactive mind maps from MINDMAP.md, and shows Mermaid diagrams from ARCHITECTURE.md.',
    code: ['planora web', 'planora web --port 8080', 'planora web --dev'],
  },
  {
    id: 'agent',
    title: 'Agent',
    body: 'Planora runs its own agent runtime. Users provide only the API key, provider, and model. Planora handles prompts, sessions, tool calls, and workflow execution.',
    items: [
      ['Providers', 'OpenRouter recommended, plus OpenAI, Ollama, OpenCode, custom'],
      ['Config', '~/.planora/config.json stored locally'],
      ['Workflows', 'plan, code, review'],
      ['Tools', 'file read/write, shell, web search, fetch'],
    ],
  },
  {
    id: 'storage',
    title: 'Storage and Privacy',
    body: 'All data stays on your machine. Project files are stored in the local directory. Configuration lives at ~/.planora/. No telemetry, no cloud sync. The only external connection is the AI provider API when you run AI-assisted commands.',
    items: [
      ['Database', 'SQLite (local-first)'],
      ['Config', '~/.planora/config.json (chmod 600)'],
      ['Projects', 'local directory where planora init runs'],
      ['Privacy', 'no data sent except to your chosen AI provider'],
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    body: 'Common issues and their fixes.',
    items: [
      ['Node version', 'Run node --version. Planora requires Node.js 20+.'],
      ['Missing API key', 'Run planora config and follow the wizard to set up your provider.'],
      ['Port conflict', 'Use planora web --port 8080 to pick a different port.'],
      ['Build errors', 'Run rm -rf node_modules && npm install && npm run build.'],
      ['Command not found', 'Run npm link --workspace @planora/cli or check your PATH.'],
    ],
  },
  {
    id: 'status',
    title: 'Current Status',
    body: 'What works now and what is still planned.',
    items: [
      ['Working', 'CLI commands, AI config, plan generators, agent runtime, local web app'],
      ['In progress', 'full dashboard with project views, mind map and diagram rendering'],
      ['Planned', 'npm publishing, VS Code extension, optional Hermes orchestration'],
    ],
  },
];
