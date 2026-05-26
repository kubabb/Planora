# AGENTS.md — Planora

> Operating manual. Read before touching any file.

## Project

Planora = developer tool: CLI + VS Code extension + local React web app.
Generates `.md` project plans, mind maps (markmap), Mermaid diagrams.
Integrates Hermes AI agent for AI-assisted planning.

## Repo Layout

```
Planora/
├── packages/
│   ├── core/          # @planora/core — models, generators, storage, analyzers
│   ├── cli/           # @planora/cli — 7 commands (init, plan, analyze, roadmap, mindmap, hermes, web)
│   ├── vscode-ext/    # @planora/vscode-ext — Command Palette + Webview
│   ├── web/           # @planora/web — React 18 + Vite 5 + Tailwind (localhost:4173)
│   └── runner/        # @planora/runner — Hermes bridge + job-runner
├── plans/             # 7 implementation plans — read before implementing
├── .github/workflows/ # ci.yml + security-audit.yml
├── .githooks/         # pre-push security gate
├── .gitleaks.toml     # Gitleaks allowlist
├── tsconfig.base.json # Shared TS strict config
├── AGENTS.md          # ← this file
├── SOUL.md            # Agent identity (permanent, doesn't change with repo)
└── README.md
```

## Tech Stack

| Layer | Choice | Details |
|-------|--------|---------|
| Language | TypeScript 5+ strict | `tsconfig.base.json` — bundler resolution, ESNext |
| Runtime | Node.js 20+ | — |
| Monorepo | npm workspaces | NOT pnpm — user has npm |
| CLI | Commander.js | Binary: `planora` via `@planora/cli` bin |
| Web | React 18 + Vite 5 | `@vitejs/plugin-react`, Tailwind CSS |
| Diagrams | Mermaid.js 10+ | `mermaid.render()` in React |
| Mind maps | markmap-js | From MINDMAP.md markdown |
| Structured DB | SQLite (better-sqlite3) | Local-first, zero config |
| Vector DB | Qdrant Cloud | eu-central-1, 4 GB, 1024-dim Cosine |
| Search | SearXNG (Docker) | Self-hosted metasearch, 100+ engines, port 8080 |
| AI Agent | Hermes Agent | OpenRouter, OpenCode, Ollama, or custom |
| Web Crawler | Crawl4AI | `pip install -U crawl4ai` — web → clean Markdown |
| CI/CD | GitHub Actions | ci.yml + security-audit.yml |

## Conventions

- **Naming:** `@planora/<pkg>`, kebab-case files, PascalCase components
- **Commits:** Conventional Commits — `typ(kat): opis`. Types: feat, fix, docs, ci, sec, refactor, chore
- **Branch:** main only (for now)
- **File writes:** `cat << 'EOF'` heredoc + `ls -la` verify. Fallback: `write_file` for content with `&`
- **Port:** Web app runs on `localhost:4173` (not 3000 or 5173)
- **Markdown-first:** All plans are `.md`. No proprietary formats.
- **Core as dual CJS+ESM:** CLI (Node) needs CJS, Web (Vite) needs ESM. `tsconfig.base.json` must support both.

## Milestones

| M# | What | Est. |
|----|------|------|
| M1 | Monorepo skeleton | 1-2d |
| M2 | Core — models, generators, storage | 3-5d |
| M3 | File generators — full `.md` output | 3-4d |
| M4 | React localhost web app | 5-7d |
| M5 | CLI commands | 3-4d |
| M6 | VS Code extension | 3-4d |
| M7 | Hermes deep integration | 3-5d |

**Build order:** M4 (Web) before M5 (CLI) — web app works with mock data and proves generators work.

## Agent Workflow

```
User → Planner → delegates to:
  ├── Architect   (structure, API design, data model)
  ├── Coder       (implementation — max 3 parallel)
  ├── Reviewer    (code review, security check)
  └── DevOps      (CI/CD, deployment config)
```

### Delegation Protocol

**Caveman FULL for all subagents.** Format:

```
GOAL:     one sentence — exactly what to do
CONTEXT:  paths, versions, conventions, constraints (everything subagent must know)
OUTPUT:   list of specific files to create/modify
VERIFY:   commands to verify (stat, curl, npm test, tsc --noEmit)
```

### Limits

- **Max 3 subagents parallel**
- **Spawn depth = 1** (subagents CANNOT delegate further)
- **Isolated terminals** per subagent
- **Never trust subagent self-reports** — always verify: stat files, run builds, curl URLs

## Infrastructure

### Qdrant Cloud (Vector Memory)

- **Region:** eu-central-1 (AWS), 4 GB
- **Collections (4):**
  - `planora_project_plans` — plan embeddings
  - `planora_code_snippets` — code patterns
  - `planora_decisions` — ADR / architecture decisions
  - `planora_agent_memory` — long-term agent memory
- **Vectors:** 1024 dim, Cosine distance
- **Config:** `~/.planora/qdrant-config.json` (chmod 600, **NEVER commit**)
- **MCP:** `claude-qdrant-mcp` — connect via `~/.hermes/config.yaml`

### SearXNG (Privacy-First Metasearch)

- **Docker:** `searxng/searxng:latest` on port 8080
- **Engines:** 100+ (Google, GitHub, npm, PyPI, arXiv, StackOverflow)
- **Use:** `planora analyze` — parallel GitHub + npm search. `planora plan --ai` — best practices search.
- **Config:** `searxng-config/settings.yml` — engine whitelist

### SQLite (Structured Storage)

- **Adapter:** `packages/core/src/storage/sqlite.ts`
- **Tables:** `users`, `projects`, `plan_files`, `hermes_runs`
- **CRUD:** User, Project, PlanFile, HermesRun

### Obsidian (Planora-Brain)

- **Path:** `/mnt/c/Users/kubar/OneDrive/Dokumenty/Planora-Brain/`
- `Atlas/` — structured knowledge (PRD, milestones, architecture)
- `skills/INDEX.md` — available skills catalog
- `mcp/INDEX.md` — MCP servers + tools
- `agents/INDEX.md` — specialized AI agents catalog
- `protocols/` — caveman + delegation rules
- **Rule:** load Brain before delegating any task

### Skills (Agent Capabilities)

Install: `npx skills add <source>`. Key sources:

| Source | Contains |
|--------|----------|
| `github/awesome-copilot` | TypeScript, React, SQLite, CLI, VS Code, Mermaid |
| `wshobson/agents` | Architecture patterns, testing, error handling |
| `supabase/agent-skills` | Supabase (optional — use only if not SQLite) |
| `JuliusBrussee/caveman` | ~65% token compression |
| `K-Dense-AI/scientific-agent-skills` | 138 scientific skills |
| `msitarzewski/agency-agents` | 30+ specialized AI agents |
| `steel-dev/awesome-web-agents` | Browser/web agents |
| `livekit/agents-js` | Conversational voice agents |

Browse: https://skills.sh, https://skillsmp.com

### MCP (Model Context Protocol)

Servers configured in `~/.hermes/config.yaml` → `mcpServers`:

| Server | Purpose | Command |
|--------|---------|---------|
| Context7 | Library docs lookup | Integrated: `mcp_context7_docs_*` |
| Memory | Knowledge graph | `npx -y @modelcontextprotocol/server-memory` |
| Filesystem | Secure file ops | `npx -y @modelcontextprotocol/server-filesystem` |
| Git | Repo operations | `uvx mcp-server-git` |
| Sequential Thinking | Complex reasoning | `npx -y @modelcontextprotocol/server-sequential-thinking` |
| Qdrant | Vector search | `claude-qdrant-mcp` |

### Crawl4AI

```bash
pip install -U crawl4ai
crawl4ai-setup
```

Use for: `planora analyze` (crawl existing docs), extracting library docs, GitHub README parsing.

## CI/CD & Security

### CI Pipeline (`.github/workflows/ci.yml`)

- **Trigger:** push (main/master/develop) + PR
- **Steps:** checkout → Node 20 → `npm ci` → `npm test` → `npm run build`
- **Conditional:** skips when no `package-lock.json` (pre-M1 safety)

### Security Pipeline (`.github/workflows/security-audit.yml`)

- **Trigger:** push + PR + weekly cron (Monday 6AM UTC)
- **Jobs:**
  - `dependency-audit` — `npm audit --audit-level=high`
  - `secret-scan` — Gitleaks + TruffleHog (verified secrets only)
  - `codeql` — GitHub CodeQL (javascript-typescript)
  - `sast` — Semgrep (`p/javascript` config)

### Pre-push Security Gate (`.githooks/pre-push`)

Runs BEFORE every push. Blocks push on failure:
1. `npm audit --audit-level=high`
2. `gitleaks detect` (if installed — `brew install gitleaks`)
3. `.env` file check — **never commit `.env` files**

### Gitleaks Config (`.gitleaks.toml`)

Allowlist: `test/`, `spec/`, `fixtures/`, `.github/`

## Before Coding

1. Read relevant plan from `plans/`
2. Load skills from Planora-Brain `skills/INDEX.md`
3. Check Context7 MCP for library docs (`mcp_context7_docs_resolve_library_id`)
4. Check Qdrant for similar past solutions
5. Follow delegation protocol (GOAL/CONTEXT/OUTPUT/VERIFY)
6. After subagent finishes: **verify** before reporting to user

## Key Verification Commands

```bash
# Build check
cd packages/core && npx tsc --noEmit
npm run build  # all packages

# Test
npm test

# Lint
npx eslint packages/*/src/

# Qdrant check
curl -H "api-key: $(jq -r .apiKey ~/.planora/qdrant-config.json)" \
  "$(jq -r .url ~/.planora/qdrant-config.json)/collections"

# Git sanity
git log --oneline -5
git status --short
```
