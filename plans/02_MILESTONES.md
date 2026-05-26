# Planora — Milestones & Phases

## Overview

Projekt podzielony na 7 kamieni milowych. Każdy milestone to samodzielna, testowalna całość.

**Kluczowa zmiana (v2):** Planora ma własnego agenta AI. User nie potrzebuje Hermesa. Hermes jest opcjonalnym orchestratorem dla power-userów.

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

## M2: Core — AiClient, Config, Models & Storage

**Cel:** Współdzielony core — własny klient LLM, system konfiguracji, modele danych, generatory, storage.

### Zadania

- [ ] **AiClient — bezpośrednia komunikacja z AI API:**
  ```typescript
  // packages/core/src/ai/
  // types.ts, client.ts, openai-compatible.ts, openrouter.ts, openai.ts, ollama.ts, factory.ts
  interface AiClient {
    generate(messages: AiMessage[], config: AiConfigOverrides): Promise<AiResponse>;
    generateWithTools(messages: AiMessage[], tools: AiTool[], config: AiConfigOverrides): Promise<AiResponse>;
    generateStructured<T>(messages: AiMessage[], schema: ZodSchema<T>, config: AiConfigOverrides): Promise<T>;
    generateStream(messages: AiMessage[], config: AiConfigOverrides): AsyncIterable<AiStreamEvent>;
    testConnection(): Promise<{ ok: boolean; model: string; latency: number }>;
  }
  ```
  - Implementacje: OpenRouter, OpenAI, Ollama, OpenCode, OpenAI-compatible
  - Retry z exponential backoff
  - Error handling: AuthError, RateLimitError, TimeoutError, AiError

- [ ] **Config system — zarządzanie kluczem API:**
  ```typescript
  // packages/core/src/config/
  interface PlanoraConfig {
    version: number;
    providers: Record<string, ProviderConfig>;
    preferences: UserPreferences;
  }
  ```
  - `loader.ts` — read/write `~/.planora/config.json` (chmod 600)
  - `validator.ts` — walidacja + test połączenia
  - Maskowanie API key w logach (`sk-...****`)

- [ ] **Data models:**
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
    type: 'PROJECT_PLAN' | 'ROADMAP' | 'MINDMAP' | 'ARCHITECTURE' | 'AGENT_SETUP';
    content: string;
    projectId: string;
  }

  interface AgentRun {
    id: string;
    projectId: string;
    workflow: 'plan' | 'code' | 'review';
    status: 'pending' | 'running' | 'success' | 'failed';
    output: string;
    stepsUsed: number;
    tokensUsed: number;
    startedAt: Date;
    finishedAt: Date;
  }
  ```

- [ ] **Storage:**
  - SQLite adapter (`src/storage/sqlite.ts`)
  - CRUD dla User, Project, AgentRun

- [ ] **Utils:**
  - Mermaid block builder
  - Markdown outline builder (dla mindmap)
  - Stack recommender

### Deliverables
- Paczka `@planora/core` z pełnym API
- AiClient działa z minimum 3 providerami
- Konfiguracja zapisywana/odczytywana z `~/.planora/config.json`
- Testy jednostkowe AiClient (mock fetch) + config loadera

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

- [ ] **AGENT_SETUP.md** — konfiguracja agenta Planory:
  - Provider + model
  - Workflowy (plan, code, review)
  - Tool registry
  - Historia runów

- [ ] **planora.json** — metadane:
  ```json
  {
    "projectId": "uuid",
    "name": "string",
    "stack": ["string"],
    "files": ["PROJECT_PLAN.md", ...],
    "agentReady": true
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
  - `/project/:id/agent` → Agent View (status, runy, historia)

- [ ] **Dashboard:**
  - Lista projektów (fetch z SQLite przez API)
  - Przycisk "Nowy projekt"
  - Search / filter

- [ ] **Project View:**
  - Overview (z PROJECT_PLAN.md)
  - Roadmapa (z ROADMAP.md)
  - Linki do Mind Map, Graphs, Agent

- [ ] **Mind Map View:**
  - Renderowanie MINDMAP.md przez markmap
  - Fullscreen, interaktywna (zoom, pan, collapse)

- [ ] **Graphs View:**
  - Renderowanie bloków ```mermaid z ARCHITECTURE.md
  - Mermaid.js z ciemnym/jasnym motywem

- [ ] **Agent View:**
  - Status agenta (provider, model, latency)
  - Lista workflowów i ich status
  - Historia runów (logi, tokeny)

- [ ] **User profile:**
  - Lokalny profil (name, preferencje)
  - Zapis w SQLite

### Deliverables
- `npm run dev` w `packages/web` odpala apkę
- Wszystkie widoki działają z mock data
- Potem podłączone do realnych danych z core

---

## M5: CLI Commands + Agent Engine

**Cel:** Wszystkie komendy CLI + silnik agenta Planory.

### Zadania

- [ ] **Agent Engine (`packages/runner/`):**
  - `agent.ts` — główna pętla agenta (think → act → observe)
  - `session.ts` — AgentSession (zarządzanie konwersacją)
  - `prompts/` — systemowe prompty dla planisty, kodera, reviewera
  - `tools/` — rejestr tooli (file-read, file-write, file-list, shell, web-search)
  - `workflows/` — plan-workflow, code-workflow, review-workflow
  - `history.ts` — zapis runów do SQLite
  - `config.ts` — loader konfiguracji

- [ ] **`planora config`** — zarządzanie AI:
  - `planora config` → interactive wizard (pierwsze użycie)
  - `planora config show` → pokaż config (bez apiKey)
  - `planora config test` → test połączenia
  - `planora config set <key> <value>` → zmiana pojedynczej wartości

- [ ] **`planora init`** — inicjalizuje nowy projekt Planora
  - Tworzy katalog `.planora/`
  - Zapisuje `planora.json`
  - Pyta o nazwę, opis, stack

- [ ] **`planora plan`** — generuje plany:
  - `planora plan` → statyczne szablony
  - `planora plan --ai` → używa własnego agenta (AiClient → AI API)

- [ ] **`planora analyze`** — analizuje istniejące repo

- [ ] **`planora roadmap`** — generuje ROADMAP.md
- [ ] **`planora mindmap`** — generuje MINDMAP.md
- [ ] **`planora agent`** — status agenta:
  - `planora agent status` → provider, model, latency
  - `planora agent history` → historia runów

- [ ] **`planora web`** — odpala lokalną apkę React

### Deliverables
- Paczka `@planora/cli` jako globalny bin
- `planora --help` pokazuje wszystkie komendy
- Agent działa: `planora plan --ai` generuje plany przez AI
- Wizard konfiguracji: `planora config` zbiera tylko klucz API

---

## M6: VS Code Extension

**Cel:** Rozszerzenie VS Code integrujące Planorę.

### Zadania
- [ ] **Setup:** Standardowy projekt VS Code extension
- [ ] **Komendy (Command Palette):**
  - `Planora: Configure AI...` → wizard konfiguracji w webview
  - `Planora: Generate Plan (AI)` → plan --ai
  - `Planora: Generate Roadmap`
  - `Planora: Generate Mind Map`
  - `Planora: Open Web View`

- [ ] **Webview Panel:**
  - Wizard konfiguracji AI (taki sam jak CLI, ale w UI)
  - Widok projektu

- [ ] **Status Bar:**
  - Ikona Planory + status agenta (connected/disconnected)
  - Szybki dostęp do komend

- [ ] **Settings:**
  - `planora.apiKey`, `planora.provider`, `planora.model`
  - Bezpieczne przechowywanie (VS Code secrets API)

### Deliverables
- Paczka `@planora/vscode-ext`
- Działa po `F5` w VS Code
- Komendy w Command Palette
- Konfiguracja AI z poziomu VS Code

---

## M7: Opcjonalna Integracja z Hermesem

**Cel:** Hermes jako opcjonalny orchestrator dla złożonych multi-agent workflowów.

**UWAGA:** M7 jest OPCJONALNY. Planora działa w pełni bez niego (M1-M6).

### Zadania
- [ ] **Hermes Bridge:**
  - `runner/src/hermes-bridge.ts` — komunikacja z Hermes API
  - Używane tylko gdy user jawnie skonfiguruje Hermesa

- [ ] **Multi-agent workflowy (przez Hermesa):**
  - planner → coder → reviewer z subagentami
  - Używane dla złożonych projektów

- [ ] **`planora hermes init`** — konfiguracja Hermesa jako dodatku
  - Wykrywa czy Hermes jest zainstalowany
  - Konfiguruje joby dla projektu

- [ ] **Fallback:** Gdy Hermes nie jest zainstalowany → własny agent Planory

### Deliverables
- Hermes działa jako opcjonalny dodatek
- User bez Hermesa nie traci żadnej funkcjonalności
- User z Hermesem zyskuje multi-agent workflowy

---

## Timeline (szacunkowy)

| Milestone | Est. czas | Zależności | Kluczowa zmiana vs v1 |
|-----------|----------|------------|----------------------|
| M1: Monorepo | 1-2 dni | — | Bez zmian |
| M2: Core + AiClient | 5-7 dni | M1 | **NOWE:** AiClient, Config system |
| M3: Generators | 3-4 dni | M2 | HermesSetup → AgentSetup |
| M4: Web App | 5-7 dni | M2 | HermesView → AgentView |
| M5: CLI + Agent | 5-7 dni | M2, M3 | **NOWE:** planora config, agent engine |
| M6: VS Code | 3-4 dni | M2, M5 | Dodane settings AI |
| M7: Hermes (opcjonalny) | 2-3 dni | M5 | **ZREDUKOWANY:** tylko bridge |

**Razem: ~24-34 dni** (full-time dev)
