# Planora — Progress Tracker

> Ostatnia aktualizacja: 2025-05-26

## ✅ Zrobione

### M1: Monorepo Skeleton
- [x] Root package.json z workspaces
- [x] tsconfig.base.json z composite + strict
- [x] 5 pakietów: core, cli, runner, web, vscode-ext
- [x] ESLint + Prettier config
- [x] .gitignore, .editorconfig
- [x] npm install + build przechodzi

### M2: Core — AiClient, Config, Models
- [x] `core/src/ai/types.ts` — AiConfig, AiMessage, AiResponse, AiStreamEvent
- [x] `core/src/ai/errors.ts` — AiError, AuthError, RateLimitError, TimeoutError
- [x] `core/src/ai/retry.ts` — exponential backoff
- [x] `core/src/ai/client.ts` — AiClient interface
- [x] `core/src/ai/openai-compatible.ts` — bazowa implementacja (fetch)
- [x] `core/src/ai/openrouter.ts` — OpenRouter provider
- [x] `core/src/ai/openai.ts` — Direct OpenAI
- [x] `core/src/ai/ollama.ts` — Ollama (local)
- [x] `core/src/ai/opencode.ts` — OpenCode
- [x] `core/src/ai/factory.ts` — createAiClient()
- [x] `core/src/config/types.ts` — PlanoraConfig, ProviderConfig
- [x] `core/src/config/loader.ts` — read/write ~/.planora/config.json (chmod 600)
- [x] `core/src/config/validator.ts` — walidacja + test połączenia
- [x] `core/src/models/user.ts` — User
- [x] `core/src/models/project.ts` — Project
- [x] `core/src/models/plan-file.ts` — PlanFile
- [x] `core/src/models/agent-config.ts` — AgentRun (zamiast HermesRun)
- [x] Wszystkie barrel exports z `.js` extensions (ESM)

### M5: CLI — Agent Engine + Komendy (część)
- [x] `runner/src/session.ts` — AgentSession
- [x] `runner/src/config.ts` — AgentConfig
- [x] `runner/src/prompts/system.ts` — system prompt PL/EN
- [x] `runner/src/prompts/planner.ts` — prompt planisty
- [x] `runner/src/tools/index.ts` — tools: file_read, file_write, file_list
- [x] `runner/src/agent.ts` — PlanoraAgent (think → act → observe)
- [x] `runner/src/utils.ts` — generateId
- [x] `cli/src/index.ts` — Commander.js entry point
- [x] `cli/src/commands/config.ts` — wizard + --show + --test
- [x] `cli/src/commands/agent.ts` — --status + --history (stub)
- [x] `cli/src/commands/plan.ts` — --ai flag + static fallback

### Plany
- [x] `plans/08_OWN_AGENT.md` — specyfikacja własnego agenta
- [x] `plans/03_ARCHITECTURE.md` — nowy diagram architektury
- [x] `plans/02_MILESTONES.md` — restrukturyzacja
- [x] `plans/01_PROJECT_OVERVIEW.md` — PRD v2
- [x] `plans/07_HERMES_INTEGRATION.md` — Hermes jako opcjonalny

### Brain (Obsidian)
- [x] `Atlas/Planora Own Agent ADR.md` — decyzja architektoniczna

---

## 🔲 Do zrobienia

### M2: Core — dokończenie
- [ ] `core/src/generators/` — generatory plików .md
- [ ] `core/src/storage/` — SQLite adapter
- [ ] `core/src/analyzers/` — repo analyzer, stack recommender
- [ ] `core/src/utils/` — mermaid builder, markdown utils
- [ ] Testy jednostkowe AiClient
- [ ] Testy integracyjne z OpenRouter

### M3: Generatory
- [ ] ProjectPlanGenerator
- [ ] RoadmapGenerator
- [ ] MindmapGenerator
- [ ] ArchitectureGenerator
- [ ] AgentSetupGenerator
- [ ] PlanoraJsonGenerator

### M4: Web App (zostawione — user robi osobno)

### M5: CLI — dokończenie
- [ ] `planora init` — inicjalizacja projektu
- [ ] `planora plan` (static templates, bez --ai)
- [ ] `planora web` — odpalenie web app
- [ ] `planora analyze` — analiza repo
- [ ] `planora roadmap` — sam ROADMAP.md
- [ ] `planora mindmap` — sam MINDMAP.md
- [ ] `runner/src/workflows/code-workflow.ts`
- [ ] `runner/src/workflows/review-workflow.ts`
- [ ] `runner/src/history.ts` — SQLite run history
- [ ] `cli/src/commands/init.ts`
- [ ] `cli/src/commands/analyze.ts`
- [ ] `cli/src/commands/web.ts`

### M6: VS Code Extension (później)
- [ ] Settings dla API key
- [ ] Command Palette komendy
- [ ] Status bar
- [ ] Webview wizard

### M7: Hermes (opcjonalny)
- [ ] hermes-bridge.ts
- [ ] `planora hermes init`
- [ ] Multi-agent workflowy

### Testy
- [ ] Testy jednostkowe (vitest)
- [ ] CI pipeline — testy w GitHub Actions

### Dokumentacja
- [ ] README.md aktualizacja
- [ ] AGENTS.md aktualizacja
