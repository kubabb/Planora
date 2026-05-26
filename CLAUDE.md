# CLAUDE.md - Planora

> Repo map for AI collaborators working on Planora.

## Project

Planora is a project-planning tool with three user-facing surfaces: CLI, VS Code extension, and a local web app.

It should generate Markdown plans, mind maps, and Mermaid diagrams through Planora's own agent runtime.

## Boundary

- Product: Planora runs standalone with a provider API key such as OpenRouter.
- Repo workflow: Hermes files and related notes support development of Planora itself.

Do not treat Hermes as a product dependency unless a task is explicitly about the optional addon layer.

## Repo Layout

```text
Planora/
|- packages/
|  |- core/        # shared models, generators, storage, AI client
|  |- cli/         # terminal interface
|  |- vscode-ext/  # VS Code integration
|  |- web/         # local dashboard
|  `- runner/      # own agent runtime, optional Hermes bridge
|- plans/
|- .github/workflows/
|- .githooks/
`- tsconfig.base.json
```

## Conventions

- Language: TypeScript strict mode
- Monorepo: npm workspaces
- Commits: conventional commits
- Security: pre-push checks, no secrets in repo

## Tech Stack

| Layer | Choice |
|-------|--------|
| Language | TypeScript 5+ |
| Runtime | Node.js 20+ |
| Monorepo | npm workspaces |
| Web | React 18 + Vite |
| DB | SQLite |
| AI | Planora own agent, Hermes optional |

## Planning Notes

- Default to the direction in `plans/08_OWN_AGENT.md`
- Read older Hermes-heavy docs as historical unless they explicitly describe the optional addon layer
