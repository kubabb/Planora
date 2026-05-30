# Planora

AI-powered project planning, mind maps, architecture diagrams, and a local project dashboard.

Product site: https://planora-web-beryl.vercel.app/

## Install

```bash
npm install -g planora
```

Requires Node.js 20+.

## Quick Start

```bash
planora config
planora init
planora plan --ai
planora web
```

`planora web` opens the local user dashboard backed by local project data and generated files.

## AI Setup

Planora works with OpenRouter, OpenAI, Ollama, OpenCode, and OpenAI-compatible providers.

Recommended cheap OpenRouter model:

```text
openai/gpt-4o-mini
```

Free OpenRouter models can fail for agent workflows when they do not support tool calling. `planora config` tests basic connectivity and tool-calling support so unsupported models fail early with a clearer message.

## Project Creation

`planora init` asks for:

- project name
- project description
- available timeline
- tech stack

If you do not know the stack, answer `nie wiem`. Planora will ask follow-up questions and suggest a stack, for example web app, API, database, or mobile.

You can also pass values directly:

```bash
planora init --name "my-app" --description "Task manager" --stack "nie wiem" --timeline "3 tygodnie"
```

## Generated Files

| File | Purpose |
| --- | --- |
| `PROJECT_PLAN.md` | Overview, MVP, stack, milestones, timeline-aware plan |
| `ROADMAP.md` | Phased development roadmap |
| `MINDMAP.md` | Hierarchical outline rendered as a mind map |
| `ARCHITECTURE.md` | Mermaid architecture and flow diagrams |
| `AGENT_SETUP.md` | Provider, model, and workflow notes |
| `planora.json` | Project metadata |

## Dashboard

Run:

```bash
planora web
```

The dashboard shows local Planora projects, mind maps, and architecture graphs.

For local development of the dashboard:

```bash
npm run dev --workspace planora-web
```

Open:

```text
http://127.0.0.1:4173/dashboard.html
```

## Package Layout

```text
planora          public CLI package installed by users
planora-core     internal core package: models, generators, storage, AI client
planora-runner   internal agent runtime and tools
planora-web      internal React/Vite dashboard package
```

Release rule of thumb:

```text
core changed    -> publish planora-core, then affected packages
runner changed  -> publish planora-runner, then planora
web changed     -> publish planora-web, then planora
cli changed     -> publish planora
```

Users normally install only:

```bash
npm install -g planora
```

## Development

```bash
npm install
npm run build
npm test
```

Useful commands:

```bash
npm run build:web
npm run build --workspace planora
npm run build --workspace planora-core
npm run build --workspace planora-runner
```

## Monorepo Structure

```text
packages/
|- core/        # planora-core
|- cli/         # planora
|- runner/      # planora-runner
|- web/         # planora-web
`- vscode-ext/  # VS Code integration
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Language | TypeScript |
| Runtime | Node.js 20+ |
| Monorepo | npm workspaces |
| CLI | Commander.js |
| Web | React 18 + Vite |
| Diagrams | Mermaid.js |
| Mind Maps | markmap.js |
| Storage | SQLite local-first |
| AI | OpenAI-compatible APIs |

## Standalone Skill

Planora is also available as a standalone agent skill — no installation, no CLI, no dependencies. Use it with Hermes, Codex, Claude Code, Cursor, or any agent with file access.

```text
https://github.com/kubabb/planora-skill
```

The skill generates the same planning artifacts (PROJECT_PLAN, ROADMAP, MINDMAP, ARCHITECTURE, AGENT_SETUP) as a portable set of Markdown instructions that work in any AI agent environment.

## License

MIT
