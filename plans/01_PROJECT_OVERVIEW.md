# Planora — PRD (Product Requirements Document) v2

## Executive Summary

Planora to narzędzie deweloperskie dostępne jako CLI, rozszerzenie VS Code oraz lokalna aplikacja webowa. Pomaga planować nowe projekty, analizować istniejące repozytoria, generować roadmapy rozwoju, rekomendować stack technologiczny, tworzyć dokumentację projektową w Markdown oraz — przez wbudowanego agenta AI — generować inteligentne plany projektów.

**Kluczowa filozofia:** Markdown jest single source of truth. Wszystkie plany, mapy myśli i diagramy to zwykłe pliki `.md`. CLI, VS Code i web app to różne widoki na te same dane.

**Kluczowa zmiana v2:** Planora ma **własnego agenta AI**. User podaje tylko klucz API — Planora samodzielnie zarządza komunikacją z modelami AI (OpenRouter, OpenAI, Ollama). Nie trzeba instalować Hermesa.

---

## Problem

Deweloperzy przy starcie nowego projektu muszą ręcznie:
- planować architekturę,
- wybierać stack,
- pisać dokumentację,
- konfigurować narzędzia AI.

Brakuje jednego narzędzia, które zautomatyzuje ten proces end-to-end — od pomysłu do gotowego środowiska deweloperskiego z agentem AI, **bez zewnętrznych zależności**.

---

## Rozwiązanie

Planora automatyzuje:
1. **Generowanie planów (AI)** — PROJECT_PLAN.md, ROADMAP.md, MINDMAP.md, ARCHITECTURE.md — przez własnego agenta AI
2. **Wizualizację** — mapy myśli (markmap) i diagramy (Mermaid) w lokalnej apce React
3. **Zarządzanie projektami** — dashboard, user profile, historia runów agenta
4. **Zero-config AI** — user podaje tylko klucz API; Planora resztę robi sama

---

## Delivery Channels

| Kanał | Opis |
|-------|------|
| **CLI** | Terminal: `planora init`, `planora plan --ai`, `planora config`, `planora web` |
| **VS Code Extension** | Komendy z palety: generuj plan, roadmapę, mind mapę; konfiguracja AI; otwórz web |
| **Web App (localhost)** | React na `localhost:4173` — dashboard, widoki projektu, mapy, grafy, agent status |

---

## Core Features

### 1. Własny Agent AI
- Wbudowany klient LLM (`core/src/ai/`) — bezpośrednia komunikacja z AI API
- Providerzy: OpenRouter (rekomendowany), OpenAI, Ollama (lokalny), OpenCode, custom
- User podaje tylko klucz API → zapisany lokalnie w `~/.planora/config.json` (chmod 600)
- Agent potrafi: planować projekty, generować kod, robić code review
- Tool-calling: czytanie/pisanie plików, shell, web search (SearXNG)
- Historia wszystkich runów w SQLite

### 2. Generowanie plików Markdown
- `PROJECT_PLAN.md` — opis, MVP, stack, milestone'y
- `ROADMAP.md` — plan rozwoju w etapach
- `MINDMAP.md` — hierarchiczny outline → renderowany jako mapa myśli
- `ARCHITECTURE.md` — diagramy Mermaid (flowchart, graph, roadmap, dependency)
- `AGENT_SETUP.md` — konfiguracja agenta (provider, model, workflowy)
- `planora.json` — metadane projektu

### 3. Wizualizacje
- **Mind Map** — źródło: MINDMAP.md, renderer: markmap
- **Grafy** — źródło: bloki ```mermaid w Markdown, renderer: Mermaid w React

### 4. Aplikacja React (localhost)
- Dashboard — lista projektów
- Project View — szczegóły projektu (overview, roadmapa, metadane)
- Mind Map View — pełnoekranowa interaktywna mapa myśli
- Graphs View — diagramy Mermaid
- Agent View — status agenta, model, runy, historia, zużycie tokenów

### 5. Konfiguracja AI (wizard CLI)
- `planora config` — interaktywny wizard (pierwsze uruchomienie)
- Wybór providera, podanie klucza API, wybór modelu
- Test połączenia
- Konfiguracja zapisywana lokalnie, NIGDY nie wysyłana nigdzie

### 6. Opcjonalnie: Hermes Agent
- Dla power-userów: multi-agent workflowy (planner → coder → reviewer z subagentami)
- Hermes NIE jest wymagany do podstawowego działania Planory
- Zobacz `plans/07_HERMES_INTEGRATION.md`

---

## Tech Stack

| Warstwa | Technologia |
|---------|------------|
| Język | TypeScript (strict) |
| Runtime | Node.js 20+ |
| Monorepo | npm workspaces |
| CLI | Commander.js |
| VS Code | Extension API |
| Web | React + Vite, Mermaid.js, markmap |
| Baza | SQLite (local), opcjonalnie Supabase |
| AI | Własny AiClient (fetch do OpenAI-compatible API) |
| Vector DB | Qdrant Cloud (pamięć semantyczna) |
| Search | SearXNG (Docker, privacy-first) |
| Metadane | planora.json |

---

## User Flow

```
1. Instalacja:           npm install -g planora
2. Konfiguracja AI:      planora config
                          → podaj klucz API OpenRouter
                          → wybierz model
3. Nowy projekt:         planora init
4. Generuj plan (AI):    planora plan --ai
                          → agent tworzy wszystkie plany .md
5. Podgląd w web:        planora web
                          → dashboard z projektami
6. Pracuj dalej:         planora analyze, planora roadmap, ...
```

---

## Success Metrics

- [ ] `planora config` — konfiguracja AI w <60s (3 pytania + test)
- [ ] `planora init` tworzy działający projekt w <30s
- [ ] `planora plan --ai` generuje wszystkie plany przez AI
- [ ] `planora web` otwiera dashboard z projektami
- [ ] Mind map z MINDMAP.md renderuje się poprawnie
- [ ] Diagramy Mermaid z ARCHITECTURE.md renderują się w web app
- [ ] Agent potrafi wygenerować plan BEZ Hermesa
- [ ] API key NIGDY nie wycieka (logi, output, git)

---

## Non-Goals (v1)

- Multi-user collaboration
- Cloud hosting
- Mobile app
- Plugin system
- AI chat w web app
- Hermes jako wymóg (jest opcjonalny)
