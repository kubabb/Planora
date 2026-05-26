# Planora — PRD (Product Requirements Document)

## Executive Summary

Planora to narzędzie deweloperskie dostępne jako CLI, rozszerzenie VS Code oraz lokalna aplikacja webowa. Pomaga planować nowe projekty, analizować istniejące repozytoria, generować roadmapy rozwoju, rekomendować stack technologiczny, tworzyć dokumentację projektową w Markdown oraz przygotowywać środowisko agenta Hermes.

**Kluczowa filozofia:** Markdown jest single source of truth. Wszystkie plany, mapy myśli i diagramy to zwykłe pliki `.md`. CLI, VS Code i web app to różne widoki na te same dane.

---

## Problem

Deweloperzy przy starcie nowego projektu muszą ręcznie:
- planować architekturę,
- wybierać stack,
- pisać dokumentację,
- konfigurować narzędzia AI (jak Hermes).

Brakuje jednego narzędzia, które zautomatyzuje ten proces end-to-end — od pomysłu do gotowego środowiska deweloperskiego z agentem AI.

---

## Rozwiązanie

Planora automatyzuje:
1. **Generowanie planów** — PROJECT_PLAN.md, ROADMAP.md, MINDMAP.md, ARCHITECTURE.md
2. **Wizualizację** — mapy myśli (markmap) i diagramy (Mermaid) w lokalnej apce React
3. **Konfigurację Hermesa** — joby, modele, workflow per projekt
4. **Zarządzanie projektami** — dashboard, user profile, historia runów

---

## Delivery Channels

| Kanał | Opis |
|-------|------|
| **CLI** | Terminal: `planora init`, `planora plan`, `planora web` itd. |
| **VS Code Extension** | Komendy z palety: generuj plan, roadmapę, mind mapę, otwórz web |
| **Web App (localhost)** | React na `localhost:4173` — dashboard, widoki projektu, mapy, grafy |

---

## Core Features

### 1. Generowanie plików Markdown
- `PROJECT_PLAN.md` — opis, MVP, stack, milestone'y
- `ROADMAP.md` — plan rozwoju w etapach
- `MINDMAP.md` — hierarchiczny outline → renderowany jako mapa myśli
- `ARCHITECTURE.md` — diagramy Mermaid (flowchart, graph, roadmap, dependency)
- `HERMES_SETUP.md` — opis jobów, modeli i workflow Hermesa
- `planora.json` — metadane projektu dla aplikacji webowej

### 2. Wizualizacje
- **Mind Map** — źródło: MINDMAP.md, renderer: markmap / Mermaid mindmap
- **Grafy** — źródło: bloki ```mermaid w Markdown, renderer: Mermaid w React

### 3. Aplikacja React (localhost)
- Dashboard — lista projektów
- Project View — szczegóły projektu (overview, roadmapa, metadane)
- Mind Map View — pełnoekranowa interaktywna mapa myśli
- Graphs View — diagramy Mermaid
- Hermes View — modele, joby, runy, logi

### 4. Powiązanie z użytkownikiem
- Lokalny profil (SQLite na start, opcjonalnie Supabase)
- Każdy projekt ma `user_id`
- Każdy plik przypisany do projektu → projektu do usera

### 5. Hermes Integration
- Konfiguracja modeli: OpenRouter, OpenCode, Ollama, custom OpenAI-compatible
- Joby: planner, coder, reviewer
- Przygotowanie środowiska per projekt

---

## Tech Stack

| Warstwa | Technologia |
|---------|------------|
| Język | TypeScript (strict) |
| Runtime | Node.js 20+ |
| Monorepo | npm workspaces / turborepo |
| CLI | Node.js + commander / clipanion |
| VS Code | Extension API |
| Web | React + Vite, Mermaid.js, markmap |
| Baza | SQLite (local), opcjonalnie Supabase |
| Metadane | planora.json |

---

## Success Metrics

- [ ] `planora init` tworzy działające monorepo w <30s
- [ ] `planora plan` generuje wszystkie 6 plików
- [ ] `planora web` otwiera dashboard z projektami
- [ ] Mind map z MINDMAP.md renderuje się poprawnie
- [ ] Diagramy Mermaid z ARCHITECTURE.md renderują się w web app
- [ ] Hermes setup generuje poprawny config

---

## Non-Goals (v1)

- Multi-user collaboration
- Cloud hosting
- Mobile app
- Plugin system
- AI chat w web app
