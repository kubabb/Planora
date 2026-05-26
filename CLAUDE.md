# AGENTS.md — Planora

> AI agents working on Planora: read this first. It's the map of the territory.

## Project

Planora = developer tool for project planning. CLI + VS Code ext + local React web app.
Generates .md plans, mind maps, Mermaid diagrams. Hermes AI agent integration.

## Repo layout

```
Planora/
├── packages/
│   ├── core/          # @planora/core — models, generators, storage (SQLite)
│   ├── cli/           # @planora/cli — terminal commands
│   ├── vscode-ext/    # @planora/vscode-ext — VS Code extension
│   ├── web/           # @planora/web — React + Vite dashboard
│   └── runner/        # @planora/runner — Hermes bridge
├── plans/             # 7 implementation plans (read before coding)
├── .github/workflows/ # CI + security pipelines
├── .githooks/         # pre-push security gate
└── tsconfig.base.json # Shared TS strict config
```

## Conventions

- **Language:** TypeScript strict mode
- **Monorepo:** pnpm workspaces
- **Naming:** `@planora/<package>`, kebab-case files, PascalCase components
- **Commits:** Conventional Commits PL — `typ(kat): opis` (feat, fix, docs, ci, sec, refactor)
- **Branch:** main only for now
- **CI:** auto on push — `npm ci → test → build`
- **Security gate:** pre-push hook runs `npm audit` + gitleaks + `.env` check

## Tech stack

| Layer | Choice |
|-------|--------|
| Language | TypeScript 5+ strict |
| Runtime | Node.js 20+ |
| Monorepo | pnpm workspaces |
| CLI | Commander.js |
| Web | React 18 + Vite + Tailwind |
| Diagrams | Mermaid.js |
| Mind maps | markmap.js |
| DB | SQLite (local-first), optional Supabase |
| AI | Hermes Agent (planner, coder, reviewer jobs) |
| CI | GitHub Actions |
| Vector DB | Qdrant (semantic memory for plans) |

## Milestones

| M# | What | Est. |
|----|------|------|
| M1 | Monorepo skeleton | 1-2d |
| M2 | Core — models, generators, storage | 3-5d |
| M3 | File generators — full .md output | 3-4d |
| M4 | React localhost web app | 5-7d |
| M5 | CLI commands | 3-4d |
| M6 | VS Code extension | 3-4d |
| M7 | Hermes deep integration | 3-5d |

## Agent workflow

```
User → Planner (me) → delegates to:
  ├── Architect (structure, API design)
  ├── Coder (implementation)
  ├── Reviewer (code review)
  └── DevOps (CI/CD)
```

**Subagents get caveman FULL protocol.** Polish user gets clarity.

## Key files

- Full plans: `plans/` (7 files)
- CI workflow: `.github/workflows/ci.yml`
- Security: `.github/workflows/security-audit.yml` + `.githooks/pre-push`
- LSP: `tsconfig.base.json`
- Gitignore: `.gitignore`

## External brain

Planora-Brain @ `/mnt/c/Users/kubar/OneDrive/Dokumenty/Planora-Brain/`
- Skills index, MCP servers, agents catalog, protocols

## Before coding

1. Read relevant plan from `plans/`
2. Load skills from Planora-Brain `skills/INDEX.md`
3. Use Context7 MCP for library docs
4. Caveman FULL for all subagent comms
