# Planora — Milestones & Phases

## Overview

Projekt podzielony na 7 kamieni milowych. Każdy milestone to samodzielna, testowalna całość.

---

## M1: Monorepo Skeleton

**Cel:** Struktura projektu, konfiguracja TypeScript, package manager.

### Zadania
- [ ] `package.json` root z workspaces
- [ ] `tsconfig.base.json` (shared TS config)
- [ ] Pakiety: `packages/core`, `packages/cli`, `packages/vscode-ext`, `packages/web`, `packages/runner`
- [ ] ESLint + Prettier config
- [ ] `.gitignore`, `.editorconfig`
- [ ] `npm install` przechodzi bez błędów
- [ ] `npm run build` buduje wszystkie pakiety

### Deliverables
- Działające monorepo
- Wszystkie pakiety mają `package.json`, `tsconfig.json`, `src/index.ts`

---

## M2: Core — Shared Models & Generators

**Cel:** Współdzielony core — modele danych, generatory plików, narzędzia.

### Zadania
- [ ] **Data models:** `Project`, `User`, `PlanFile`, `HermesConfig`
  ```typescript
  interface Project {
    id: string;
    name: string;
    description: string;
    userId: string;
    stack: string[];
    createdAt: Date;
    updatedAt: Date;
  }

  interface User {
    id: string;
    name: string;
    email?: string;
    profile: 'local' | 'supabase';
  }

  interface PlanFile {
    type: 'PROJECT_PLAN' | 'ROADMAP' | 'MINDMAP' | 'ARCHITECTURE' | 'HERMES_SETUP';
    content: string;
    projectId: string;
  }
  ```

- [ ] **Generators:**
  - `ProjectPlanGenerator` → PROJECT_PLAN.md
  - `RoadmapGenerator` → ROADMAP.md
  - `MindmapGenerator` → MINDMAP.md
  - `ArchitectureGenerator` → ARCHITECTURE.md
  - `HermesSetupGenerator` → HERMES_SETUP.md
  - `PlanoraJsonGenerator` → planora.json

- [ ] **Storage:**
  - SQLite adapter (`src/storage/sqlite.ts`)
  - CRUD dla User i Project

- [ ] **Utils:**
  - Mermaid block builder
  - Markdown outline builder (dla mindmap)
  - Stack recommender (heuristic-based, później AI)

### Deliverables
- Paczka `@planora/core` z pełnym API
- Każdy generator zwraca string (zawartość pliku)
- Testy jednostkowe generatorów

---

## M3: File Generators — Full Implementation

**Cel:** Generatory produkują kompletne, sensowne pliki Markdown.

### Zadania
- [ ] **PROJECT_PLAN.md** — szablon z:
  - Project overview
  - MVP definition
  - Tech stack recommendation
  - Milestones (1-5)
  - Risks & assumptions

- [ ] **ROADMAP.md** — szablon z:
  - Timeline (Q1-Q4 lub faza 1-4)
  - Features per phase
  - Dependencies
  - Status markers

- [ ] **MINDMAP.md** — hierarchiczny outline:
  - Nagłówki H1-H4
  - Listy nested
  - Format kompatybilny z markmap

- [ ] **ARCHITECTURE.md** — bloki Mermaid:
  - System architecture graph
  - Data flow diagram
  - Component diagram
  - Deployment diagram (opcjonalnie)

- [ ] **HERMES_SETUP.md** — konfiguracja:
  - Modele (provider + model name)
  - Joby (name, trigger, tools)
  - Workflow (plan → code → review)

- [ ] **planora.json** — metadane:
  ```json
  {
    "projectId": "uuid",
    "name": "string",
    "stack": ["string"],
    "files": ["PROJECT_PLAN.md", ...],
    "hermesReady": false
  }
  ```

### Deliverables
- Wszystkie 6 generatorów daje poprawny output
- Testy porównują output z oczekiwanym schematem

---

## M4: React Localhost Web App

**Cel:** Aplikacja React + Vite na localhost z dashboardem i widokami.

### Zadania
- [ ] **Setup:** Vite + React + TypeScript w `packages/web`
- [ ] **Routing:** React Router v6
  - `/` → Dashboard
  - `/project/:id` → Project View
  - `/project/:id/mindmap` → Mind Map View
  - `/project/:id/graphs` → Graphs View
  - `/project/:id/hermes` → Hermes View

- [ ] **Dashboard:**
  - Lista projektów (fetch z SQLite przez API)
  - Przycisk "Nowy projekt"
  - Search / filter

- [ ] **Project View:**
  - Overview (z PROJECT_PLAN.md)
  - Roadmapa (z ROADMAP.md)
  - Linki do Mind Map, Graphs, Hermes

- [ ] **Mind Map View:**
  - Renderowanie MINDMAP.md przez markmap
  - Fullscreen, interaktywna (zoom, pan, collapse)

- [ ] **Graphs View:**
  - Renderowanie bloków ```mermaid z ARCHITECTURE.md
  - Mermaid.js z ciemnym/ jasnym motywem

- [ ] **Hermes View:**
  - Status środowiska
  - Lista modeli
  - Joby i ich status
  - Historia runów (logi)

- [ ] **User profile:**
  - Lokalny profil (name, preferencje)
  - Zapis w SQLite

### Deliverables
- `npm run dev` w `packages/web` odpala apkę
- Wszystkie widoki działają z mock data
- Potem podłączone do realnych danych z core

---

## M5: CLI Commands

**Cel:** Wszystkie komendy CLI działają przez `@planora/cli`.

### Zadania
- [ ] **`planora init`** — inicjalizuje nowy projekt Planora
  - Tworzy katalog `.planora/`
  - Zapisuje `planora.json`
  - Pyta o nazwę, opis, stack

- [ ] **`planora plan`** — generuje wszystkie pliki planu
  - Wywołuje generatory z core
  - Zapisuje pliki w katalogu projektu
  - Wyświetla summary

- [ ] **`planora analyze`** — analizuje istniejące repo
  - Czyta `package.json`, strukturę katalogów
  - Sugeruje stack
  - Generuje wstępny plan

- [ ] **`planora roadmap`** — generuje sam ROADMAP.md
  - Pyta o fazy / milestone'y
  - Opcjonalnie: AI-assisted przez Hermesa

- [ ] **`planora mindmap`** — generuje sam MINDMAP.md
  - Z istniejącego planu lub od zera

- [ ] **`planora hermes init`** — przygotowuje środowisko Hermesa
  - Generuje HERMES_SETUP.md
  - Tworzy joby (planner, coder, reviewer)
  - Config modelu (wizard: OpenRouter, Ollama, custom)

- [ ] **`planora web`** — odpala lokalną apkę React
  - Uruchamia Vite dev server
  - Otwiera przeglądarkę na `localhost:4173`

### Deliverables
- Paczka `@planora/cli` jako globalny bin
- `planora --help` pokazuje wszystkie komendy
- Każda komenda ma `--help`

---

## M6: VS Code Extension

**Cel:** Rozszerzenie VS Code integrujące Planorę.

### Zadania
- [ ] **Setup:** Standardowy projekt VS Code extension
- [ ] **Komendy (Command Palette):**
  - `Planora: Generate Plan` → wywołuje `planora plan`
  - `Planora: Generate Roadmap` → wywołuje `planora roadmap`
  - `Planora: Generate Mind Map` → wywołuje `planora mindmap`
  - `Planora: Open Web View` → otwiera webview z lokalną apką

- [ ] **Webview Panel:**
  - Otwiera widok projektu w panelu VS Code
  - Renderuje mindmap i grafy

- [ ] **Status Bar:**
  - Ikona Planory
  - Szybki dostęp do komend

- [ ] **Context menu:**
  - Klik prawym → "Planora: Analyze this project"

### Deliverables
- Paczka `@planora/vscode-ext`
- Działa po `F5` w VS Code
- Komendy w Command Palette

---

## M7: Hermes Deep Integration

**Cel:** Pełna integracja z Hermes Agent — joby, workflow, modele, historia.

### Zadania
- [ ] **Model Config Wizard:**
  - Interaktywny wybór providera
  - Test połączenia
  - Zapis configu lokalnie

- [ ] **Joby Hermesa:**
  - `planner` — generuje plan projektu przez AI
  - `coder` — implementuje feature'y
  - `reviewer` — code review

- [ ] **Workflow:**
  - user → planner → coder → reviewer
  - Trigger: ręczny lub na push

- [ ] **Historia runów:**
  - Zapis każdego runu (timestamp, status, output)
  - Wyświetlanie w Hermes View (web app)

- [ ] **Auto-setup:**
  - `planora hermes init` tworzy wszystkie joby
  - Generuje skills/hermes-agent dla projektu

- [ ] **Konfiguracja providerów:**
  - OpenRouter (api key)
  - OpenCode (api key)
  - Ollama (local endpoint)
  - Custom OpenAI-compatible

### Deliverables
- Hermes w pełni skonfigurowany po `planora hermes init`
- Joby działają i zapisują output
- Web app pokazuje historię

---

## Timeline (szacunkowy)

| Milestone | Est. czas | Zależności |
|-----------|----------|------------|
| M1: Monorepo | 1-2 dni | — |
| M2: Core | 3-5 dni | M1 |
| M3: Generators | 3-4 dni | M2 |
| M4: Web App | 5-7 dni | M2 |
| M5: CLI | 3-4 dni | M2, M3 |
| M6: VS Code | 3-4 dni | M2, M5 |
| M7: Hermes | 3-5 dni | M2, M5 |

**Razem: ~21-31 dni** (full-time dev)
