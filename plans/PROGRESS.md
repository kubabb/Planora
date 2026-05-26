# Planora — Progress Tracker

> Ostatnia aktualizacja: 2025-05-26 23:51

## ✅ Zrobione

### M1: Monorepo Skeleton
- [x] Root package.json z workspaces
- [x] tsconfig.base.json z composite + strict
- [x] 5 pakietów
- [x] Build przechodzi

### M2: Core — AiClient + Config + Models + Generatory + Storage + Memory + Analyzery + Utils
- [x] `core/src/ai/` — 11 plików, bezpośredni klient LLM (OpenRouter/OpenAI/Ollama/OpenCode)
- [x] `core/src/config/` — ~/.planora/config.json (chmod 600)
- [x] `core/src/models/` — AgentRun zamiast HermesRun
- [x] `core/src/generators/` — 6 generatorów statycznych
- [x] `core/src/storage/` — SQLite (better-sqlite3, WAL mode)
- [x] `core/src/memory/` — Qdrant vector memory (fetch-based, zero deps)
- [x] `core/src/analyzers/` — Repo analyzer + stack recommender
- [x] `core/src/utils/` — Mermaid builder (flowchart, sequence, gantt)

### M5: CLI — wszystkie 10 komend
- [x] `planora config` — wizard + --show + --test
- [x] `planora agent` — --status + --history (SQLite)
- [x] `planora plan` — statyczne szablony + --ai (agent)
- [x] `planora init` — inicjalizacja + SQLite
- [x] `planora roadmap` — ROADMAP.md
- [x] `planora mindmap` — MINDMAP.md
- [x] `planora web` — launch web app
- [x] `planora analyze` — repo analysis + stack recommend
- [x] `planora code` — AI implementuje funkcję
- [x] `planora review` — AI code review

### Agent Engine (runner)
- [x] 3 workflowy: plan, code, review
- [x] 8 tooli: file_read, file_write, file_list, search, shell, web_search, memory_store, memory_search
- [x] 7 promptów: system, planner, coder, reviewer (PL+EN)
- [x] Qdrant auto-store po każdym planie
- [x] Retry na poziomie AiClient (exponential backoff)

### Testy
- [x] 25 unit testów (vitest)
- [x] Testy: generatory (6), config (6), agent (4), analyzery (9)

### Code Quality
- [x] DRY — helpers.ts eliminuje duplikację CLI
- [x] Zero martwych importów
- [x] Provider z configa, nie hardcodowany
- [x] Sync import zamiast async w konstruktorze

---

## 🔲 Do zrobienia

### M4: Web App (user robi osobno)
### M6: VS Code extension (później)
### M7: Hermes opcjonalny orchestrator (później)

### Testy
- [ ] Testy integracyjne CLI
- [ ] Testy mermaid builder

### CI/CD
- [x] CI pipeline (test + build)
- [x] Security audit (gitleaks + semgrep + codeQL)

### Dokumentacja
- [ ] README.md z przykładami
- [ ] Brain — aktualizacja Atlas
