# Planora — Progress Tracker

> Ostatnia aktualizacja: 2025-05-26 23:00

## ✅ Zrobione

### M1: Monorepo Skeleton
- [x] Root package.json z workspaces
- [x] tsconfig.base.json z composite + strict
- [x] 5 pakietów
- [x] Build przechodzi

### M2: Core — AiClient + Config + Models + Generatory + Storage
- [x] `core/src/ai/` — 11 plików, bezpośredni klient LLM
- [x] `core/src/config/` — ~/.planora/config.json (chmod 600)
- [x] `core/src/models/` — AgentRun zamiast HermesRun
- [x] `core/src/generators/` — 6 generatorów statycznych
- [x] `core/src/storage/` — SQLite (better-sqlite3, WAL mode)

### M5: CLI (4 komendy z 7)
- [x] `planora config` — wizard + --show + --test
- [x] `planora agent` — --status + --history (SQLite)
- [x] `planora plan` — statyczne szablony + --ai (przez agenta)
- [x] `planora init` — inicjalizacja z SQLite

### Agent Engine
- [x] `runner/src/agent.ts` — pętla think → act → observe
- [x] `runner/src/session.ts` — zarządzanie konwersacją
- [x] `runner/src/prompts/` — system + planner
- [x] `runner/src/tools/` — file_read, file_write, file_list

### Plany + Brain
- [x] `plans/08_OWN_AGENT.md`
- [x] Wszystkie plany zaktualizowane
- [x] Brain: ADR + Implementation Progress

---

## 🔲 Do zrobienia

### M5: CLI — pozostałe komendy
- [ ] `planora analyze` — analiza repo
- [ ] `planora web` — odpalenie web app
- [ ] `planora roadmap` — sam ROADMAP.md
- [ ] `planora mindmap` — sam MINDMAP.md
- [ ] `planora plan --ai` — zapisywanie runów do SQLite

### Runner
- [ ] Workflow `code`
- [ ] Workflow `review`
- [ ] Więcej tooli: web_search, shell

### Core
- [ ] `core/src/analyzers/` — repo analyzer, stack recommender
- [ ] `core/src/utils/` — mermaid builder, markdown utils

### Testy
- [ ] Testy jednostkowe (vitest)
- [ ] CI pipeline

### M4: Web App (user robi osobno)
### M6: VS Code (później)
### M7: Hermes (opcjonalny)
