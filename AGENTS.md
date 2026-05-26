# AGENTS.md - Planora

> Operating manual for contributors and repo-side agents. Read before touching files.

## Project

Planora is a developer tool for project planning.

- Product surface: CLI, VS Code extension, local React web app
- Product artifacts: Markdown plans, mind maps, Mermaid diagrams
- Product runtime: standalone own-agent flow, no Hermes required

## Boundary

- For Planora users: the product should work with `planora config`, a provider API key such as OpenRouter, and Planora's own agent runtime.
- For contributors to this repo: Hermes-related files, MCP setup, Brain notes, and delegation rules are development infrastructure for building Planora.

Keep these layers separate in docs, naming, and implementation.

## Repo Layout

```text
Planora/
|- packages/
|  |- core/        # @planora/core - models, generators, storage, analyzers, AI client
|  |- cli/         # @planora/cli - config, init, plan, analyze, roadmap, mindmap, web
|  |- vscode-ext/  # @planora/vscode-ext - Command Palette + Webview
|  |- web/         # @planora/web - React 18 + Vite 5 + Tailwind
|  `- runner/      # @planora/runner - own agent runtime, optional Hermes bridge
|- plans/          # implementation plans
|- .github/workflows/
|- .githooks/
|- tsconfig.base.json
|- AGENTS.md
|- SOUL.md
`- README.md
```

## Tech Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Language | TypeScript 5+ strict | Shared config in `tsconfig.base.json` |
| Runtime | Node.js 20+ | |
| Monorepo | npm workspaces | |
| CLI | Commander.js | `planora` bin via `@planora/cli` |
| Web | React 18 + Vite 5 | Tailwind allowed |
| Diagrams | Mermaid.js | |
| Mind maps | markmap | |
| Storage | SQLite | Local-first default |
| AI runtime | Planora own agent | OpenRouter recommended |
| Optional addon | Hermes | Contributor workflow and advanced orchestration |

## Milestones

| M# | What | Est. |
|----|------|------|
| M1 | Monorepo skeleton | 1-2d |
| M2 | Core - models, generators, storage, AI client | 5-7d |
| M3 | File generators | 3-4d |
| M4 | Web app | 5-7d |
| M5 | CLI and agent runtime | 5-7d |
| M6 | VS Code extension | 3-4d |
| M7 | Optional Hermes integration | 2-3d |

## Agent Workflow

```text
User -> Planner -> delegates to:
  Architect
  Coder
  Reviewer
  DevOps
```

### Delegation Protocol

Use Caveman FULL for subagents:

```text
GOAL:    one sentence - exactly what to do
CONTEXT: paths, versions, conventions, constraints
OUTPUT:  files to create or modify
VERIFY:  commands to verify
```

### Limits

- Max 3 subagents in parallel
- Spawn depth = 1
- Verify every subagent result yourself

## Infrastructure

### SQLite

- Adapter target: `packages/core/src/storage/sqlite.ts`
- Tables should reflect product naming such as `agent_runs`, not `hermes_runs`, unless a table is explicitly for the optional Hermes addon

### Planora-Brain

- Path: `/mnt/c/Users/kubar/OneDrive/Dokumenty/Planora-Brain/`
- Use it as contributor context before delegating complex work

### MCP and Skills

- Hermes and Brain integrations are repo-development tooling
- Do not leak those assumptions into Planora's end-user product flow

## Before Coding

1. Read the relevant file in `plans/`
2. Prefer the own-agent direction in `plans/08_OWN_AGENT.md` when older docs conflict
3. Keep the product/runtime boundary clear: Planora standalone first, Hermes only as dev tooling or optional addon
4. Follow the delegation protocol
5. Verify before reporting success
