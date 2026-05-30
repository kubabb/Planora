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
    body:
      'Planora is a local-first planning system for software projects. It turns a rough idea or an existing repository into markdown plans, roadmaps, architecture notes, mind maps, and a local dashboard that stays on the user machine.',
    items: [
      ['Product site', 'The Vercel deployment is the public product page and documentation.'],
      ['Local dashboard', 'The dashboard opens from the CLI after a project has been initialized or planned.'],
      ['Source of truth', 'Generated markdown files stay readable, git-friendly, and easy to edit by hand.'],
    ],
  },
  {
    id: 'install',
    title: 'Install',
    body:
      'During development Planora is installed from the monorepo. The intended release flow is a global npm install that exposes the planora command and ships the local dashboard assets with it.',
    code: [
      'git clone https://github.com/kubabb/Planora.git',
      'cd Planora',
      'npm install',
      'npm run build',
      'npm link --workspace planora',
      'planora --help',
    ],
  },
  {
    id: 'first-run',
    title: 'First Run',
    body:
      'The shortest useful flow is configure, initialize, generate, then inspect. The web dashboard should be opened only after Planora has project data to show.',
    code: [
      'planora config',
      'planora init --name "my-app" --stack "react,node,postgres"',
      'planora plan --ai',
      'planora web',
    ],
    items: [
      ['planora config', 'Stores the selected provider, model, and API key in the local Planora config.'],
      ['planora init', 'Creates the project record and a .planora workspace.'],
      ['planora plan', 'Generates the markdown planning pack for review and iteration.'],
      ['planora web', 'Starts the user dashboard on localhost with project data from SQLite.'],
    ],
  },
  {
    id: 'configuration',
    title: 'Configuration',
    body:
      'Planora keeps user configuration local. Provider credentials are read by CLI and agent commands, while the public website never reads from the local machine.',
    items: [
      ['Config path', '~/.planora/config.json'],
      ['Recommended provider', 'OpenRouter, with OpenAI-compatible providers and Ollama supported as local or compatible options.'],
      ['Model choice', 'Stored per provider so the CLI can run without asking every time.'],
      ['Privacy boundary', 'Only AI-assisted commands talk to the selected provider API.'],
    ],
  },
  {
    id: 'generated-files',
    title: 'Generated Files',
    body:
      'Every generated artifact is a normal file. Users can commit it, edit it, regenerate it, or render it in the local dashboard.',
    items: [
      ['PROJECT_PLAN.md', 'Goals, assumptions, MVP scope, milestones, and implementation notes.'],
      ['ROADMAP.md', 'A phased delivery plan with sequencing and next steps.'],
      ['MINDMAP.md', 'A hierarchical outline that can be rendered as an interactive mind map.'],
      ['ARCHITECTURE.md', 'System architecture notes and Mermaid diagrams.'],
      ['AGENT_SETUP.md', 'Provider, model, and workflow notes for the local agent.'],
      ['planora.json', 'Machine-readable project metadata used by tooling.'],
    ],
  },
  {
    id: 'dashboard',
    title: 'Local Dashboard',
    body:
      'The dashboard is not the Vercel product page. It is a local user interface served by planora web, backed by local SQLite project records and generated markdown files.',
    code: [
      'planora web',
      'planora web --port 8080',
      'planora web --dev',
    ],
    items: [
      ['Project list', 'Reads projects from ~/.planora/planora.db.'],
      ['Project view', 'Renders PROJECT_PLAN.md with markdown support.'],
      ['Mind map', 'Renders MINDMAP.md with markmap.'],
      ['Graphs', 'Renders Mermaid blocks from ARCHITECTURE.md.'],
      ['Settings', 'Shows non-secret local configuration with API keys masked.'],
    ],
  },
  {
    id: 'product-web',
    title: 'Product Website',
    body:
      'The public website is static and deploys to Vercel. It should explain Planora, show the CLI workflow, and link to documentation without calling local dashboard APIs.',
    items: [
      ['Home', 'A product landing experience with the moon hero and CLI workflow preview.'],
      ['Documentation', 'This page, built from shared documentation sections.'],
      ['No local APIs', 'The public site should not request /api/projects or read ~/.planora.'],
      ['Deployment', 'Vercel builds packages/web and serves packages/web/dist.'],
    ],
  },
  {
    id: 'architecture',
    title: 'Architecture',
    body:
      'The monorepo separates shared planning logic, command surfaces, dashboard UI, and agent runtime so each part can evolve without coupling the product page to local user data.',
    code: [
      'packages/core       models, generators, storage, AI clients',
      'packages/cli        config, init, plan, agent, web commands',
      'packages/web        Vercel product site and local dashboard entrypoints',
      'packages/runner     agent sessions, prompts, tool execution',
      'packages/vscode-ext editor integration surface',
    ],
  },
  {
    id: 'agent',
    title: 'Agent Runtime',
    body:
      'Planora owns the planning workflow. The user chooses a provider and model, then the runner coordinates prompts, generated files, review loops, and future code tasks.',
    items: [
      ['Workflows', 'plan, code, and review are separate agent modes.'],
      ['Providers', 'OpenRouter, OpenAI, Ollama, OpenCode, and compatible APIs.'],
      ['Tooling', 'File operations, shell work, memory, and optional web search belong in the runner layer.'],
      ['Output', 'Agent output should end in durable markdown or project metadata, not hidden state.'],
    ],
  },
  {
    id: 'storage',
    title: 'Storage',
    body:
      'Planora stores project metadata in SQLite and generated content in the project directory. This keeps the dashboard fast while preserving plain files as the durable artifact.',
    items: [
      ['Database', '~/.planora/planora.db'],
      ['Projects table', 'Tracks name, description, stack, base path, and timestamps.'],
      ['Project files', 'Generated markdown lives in the project folder.'],
      ['Secrets', 'API keys belong in config and are masked in the dashboard.'],
    ],
  },
  {
    id: 'security',
    title: 'Security',
    body:
      'The local dashboard can read project files, so the server must keep file access inside the project base path and avoid exposing secrets in API responses.',
    items: [
      ['Path safety', 'Resolved file paths must stay inside the project base directory.'],
      ['Secret masking', 'Settings should display only masked API key suffixes.'],
      ['No telemetry', 'The product should not collect project contents by default.'],
      ['Audit gates', 'CI runs dependency audit, secret scanning, Semgrep, CodeQL, tests, and build.'],
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    body:
      'Most failures are caused by missing provider config, no project in SQLite yet, a port conflict, or a stale local build.',
    items: [
      ['No projects', 'Run planora init or planora plan before opening the dashboard.'],
      ['Port busy', 'Run planora web --port 8080.'],
      ['Build failed', 'Run npm run build from the repository root.'],
      ['Command missing', 'Run npm link --workspace planora in local development.'],
      ['Vercel mismatch', 'Confirm packages/web is the Vercel root and dist is the output directory.'],
    ],
  },
  {
    id: 'standalone-skill',
    title: 'Standalone Skill',
    body:
      'Planora is also available as a standalone agent skill — a portable set of instructions that generates the same planning artifacts without requiring the Planora CLI, npm, or any dependency. It works with Hermes, Codex, Claude Code, Cursor, terminal agents, or models without file access.',
    items: [
      ['Repository', 'https://github.com/kubabb/planora-skill'],
      ['How it works', 'Load the skill in your agent, describe the project, and it generates PROJECT_PLAN, ROADMAP, MINDMAP, ARCHITECTURE, and AGENT_SETUP as Markdown files.'],
      ['Environments', 'Generic, Codex, Hermes, Claude Code, Cursor, Terminal, No-tools — each with a dedicated adapter.'],
      ['No dependencies', 'The skill does not require Planora, Hermes, Node.js, or any external tool.'],
      ['Metadata', 'Uses a neutral .planner/ directory instead of .planora/ to stay independent.'],
    ],
  },
  {
    id: 'status',
    title: 'Current Status',
    body:
      'Planora already has the monorepo skeleton, CLI commands, generators, local storage, agent runtime direction, product site, and dashboard entrypoint. The next work is polish, packaging, and a reliable npm release flow.',
    items: [
      ['Working', 'TypeScript build, tests, product page, documentation route, and dashboard build.'],
      ['Needs polish', 'Dashboard visual design, stale encoding in some CLI copy, and package publishing details.'],
      ['Next release goal', 'Install from npm, run planora plan, then open planora web with the generated project visible.'],
    ],
  },
];
