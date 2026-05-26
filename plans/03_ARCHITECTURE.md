# Planora — Architektura Techniczna

## Monorepo Structure

```
Planora/
├── package.json              # root: workspaces, scripts
├── tsconfig.base.json        # shared TS config
├── .eslintrc.cjs
├── .prettierrc
├── .gitignore
├── packages/
│   ├── core/                 # @planora/core
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts               # barrel export
│   │       ├── models/
│   │       │   ├── project.ts
│   │       │   ├── user.ts
│   │       │   ├── plan-file.ts
│   │       │   └── agent-config.ts    # ← NOWY: PlanoraConfig zamiast HermesConfig
│   │       ├── ai/                    # ← NOWA SEKCJA: własny klient LLM
│   │       │   ├── types.ts           #   AiConfig, AiMessage, AiResponse
│   │       │   ├── client.ts          #   AiClient interface
│   │       │   ├── openai-compatible.ts # bazowa implementacja (fetch)
│   │       │   ├── openrouter.ts      #   OpenRouter
│   │       │   ├── openai.ts          #   Direct OpenAI
│   │       │   ├── ollama.ts          #   Ollama (local)
│   │       │   ├── opencode.ts        #   OpenCode
│   │       │   ├── factory.ts         #   createAiClient(config)
│   │       │   ├── errors.ts          #   AiError, RateLimitError, AuthError
│   │       │   ├── retry.ts           #   Exponential backoff
│   │       │   └── index.ts           #   barrel
│   │       ├── config/                # ← NOWA SEKCJA: system konfiguracji
│   │       │   ├── types.ts           #   PlanoraConfig, ProviderConfig
│   │       │   ├── loader.ts          #   read/write ~/.planora/config.json
│   │       │   └── validator.ts       #   walidacja + test połączenia
│   │       ├── generators/
│   │       │   ├── project-plan.ts
│   │       │   ├── roadmap.ts
│   │       │   ├── mindmap.ts
│   │       │   ├── architecture.ts
│   │       │   ├── agent-setup.ts     # ← ZMIANA: AgentSetup (był HermesSetup)
│   │       │   └── planora-json.ts
│   │       ├── storage/
│   │       │   ├── adapter.ts          # interface
│   │       │   ├── sqlite.ts           # SQLite impl
│   │       │   └── supabase.ts         # Supabase impl (future)
│   │       ├── analyzers/
│   │       │   ├── repo-analyzer.ts
│   │       │   └── stack-recommender.ts
│   │       └── utils/
│   │           ├── mermaid.ts
│   │           ├── markdown.ts
│   │           └── id.ts
│   │
│   ├── cli/                  # @planora/cli
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts               # entry point
│   │       ├── commands/
│   │       │   ├── init.ts
│   │       │   ├── plan.ts            # ← dodana flaga --ai
│   │       │   ├── analyze.ts
│   │       │   ├── roadmap.ts
│   │       │   ├── mindmap.ts
│   │       │   ├── config.ts          # ← NOWY: wizard AI + zarządzanie configiem
│   │       │   ├── agent.ts           # ← NOWY: agent status, history
│   │       │   ├── hermes.ts          # ← OPCJONALNE: tylko dla power-userów
│   │       │   └── web.ts
│   │       └── utils/
│   │           ├── logger.ts
│   │           └── prompts.ts
│   │
│   ├── vscode-ext/           # @planora/vscode-ext
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── extension.ts
│   │       ├── commands/
│   │       │   ├── generate-plan.ts
│   │       │   ├── generate-roadmap.ts
│   │       │   ├── generate-mindmap.ts
│   │       │   └── open-webview.ts
│   │       └── webview/
│   │           └── panel.ts
│   │
│   ├── web/                  # @planora/web
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── routes/
│   │       │   ├── Dashboard.tsx
│   │       │   ├── ProjectView.tsx
│   │       │   ├── MindMapView.tsx
│   │       │   ├── GraphsView.tsx
│   │       │   └── AgentView.tsx       # ← ZMIANA: AgentView (był HermesView)
│   │       ├── components/
│   │       │   ├── ProjectCard.tsx
│   │       │   ├── MindmapRenderer.tsx
│   │       │   ├── MermaidRenderer.tsx
│   │       │   ├── AgentStatus.tsx     # ← ZMIANA: AgentStatus (był HermesStatus)
│   │       │   └── Layout.tsx
│   │       ├── hooks/
│   │       │   ├── useProjects.ts
│   │       │   └── useAgentStatus.ts   # ← ZMIANA: useAgentStatus
│   │       └── styles/
│   │           └── globals.css
│   │
│   └── runner/               # @planora/runner
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── agent.ts              # ← NOWY: PlanoraAgent — główna pętla
│           ├── session.ts            # ← NOWY: AgentSession — konwersacja
│           ├── history.ts            # ← NOWY: historia runów (SQLite)
│           ├── config.ts             # ← NOWY: loader configu
│           ├── prompts/              # ← NOWA SEKCJA: system prompty
│           │   ├── system.ts         #   bazowy system prompt
│           │   ├── planner.ts        #   prompt planisty
│           │   ├── coder.ts          #   prompt kodera
│           │   └── reviewer.ts       #   prompt reviewera
│           ├── tools/                # ← NOWA SEKCJA: function-calling tools
│           │   ├── index.ts          #   rejestr tooli
│           │   ├── file-read.ts
│           │   ├── file-write.ts
│           │   ├── file-list.ts
│           │   ├── shell.ts
│           │   ├── web-search.ts     #   SearXNG
│           │   └── web-fetch.ts
│           ├── workflows/            # ← NOWA SEKCJA: workflowy agenta
│           │   ├── plan-workflow.ts
│           │   ├── code-workflow.ts
│           │   └── review-workflow.ts
│           └── hermes-bridge.ts      # ← OPCJONALNE: tylko dla multi-agent
│
├── plans/                    # 📁 ten folder — plany projektu
└── plan.txt                  # oryginalny brief
```

---

## Architecture Diagram

```mermaid
graph TD
    User[User / Developer]

    User --> CLI[CLI - planora]
    User --> VSCode[VS Code Extension]
    User --> Web[Web App :4173]

    CLI --> Core[Core Package]
    VSCode --> Core
    Web --> Core

    Core --> AiClient[AiClient - Direct LLM]
    Core --> Generators[File Generators]
    Core --> Storage[Storage Adapter]
    Core --> Analyzers[Repo Analyzers]
    Core --> Config[Config System]

    Config --> ConfigFile[~/.planora/config.json]
    AiClient --> AI[AI API: OpenRouter / OpenAI / Ollama]
    AI --> Models[Claude / GPT / Llama / Gemini...]

    Runner[Runner - Agent Engine] --> Core
    Runner --> Agent[PlanoraAgent]
    Agent --> AiClient
    Agent --> Tools[Agent Tools]
    Agent --> Workflows[Workflows: plan, code, review]

    Tools --> FS[File System]
    Tools --> SearXNG[SearXNG Search]

    Generators --> MD[Markdown Files]
    MD --> Mindmap[MINDMAP.md]
    MD --> Arch[ARCHITECTURE.md]
    MD --> Plan[PROJECT_PLAN.md]
    MD --> Roadmap[ROADMAP.md]
    MD --> AgentCfg[AGENT_SETUP.md]

    Storage --> SQLite[(SQLite DB)]

    Hermes[Hermes Agent] -.->|opcjonalny orchestrator| Runner

    Web --> Markmap[markmap.js]
    Web --> Mermaid[Mermaid.js]
    Markmap --> MindMapView[Mind Map View]
    Mermaid --> GraphsView[Graphs View]

    style AiClient fill:#4CAF50,stroke:#2E7D32,color:#fff
    style Agent fill:#4CAF50,stroke:#2E7D32,color:#fff
    style Hermes fill:#FF9800,stroke:#E65100,color:#fff,stroke-dasharray: 5 5
    style Config fill:#2196F3,stroke:#1565C0,color:#fff
```

> **Legenda:** 🟢 Zielony = własny agent Planory. 🟠 Pomarańczowy = Hermes (opcjonalny).

---

## Data Flow

```mermaid
flowchart LR
    A[User Input] --> B[CLI / VS Code / Web]
    B --> C[Core Package]
    C --> D{Action Type}

    D -->|plan --ai| E[Agent Engine]
    D -->|plan| F[Static Generators]
    D -->|analyze| G[Repo Analyzer]
    D -->|config| H[Config Wizard]

    E --> I[AiClient]
    I --> J[AI API]
    J --> K[AI Model]
    K --> L[Generated Content]

    F --> L
    G --> L
    L --> M[Write .md files]

    M --> N[(SQLite DB)]
    N --> O[Web App reads]
    O --> P[markmap / Mermaid render]
```

---

## Data Model

```mermaid
erDiagram
    User ||--o{ Project : owns
    Project ||--o{ PlanFile : contains
    Project ||--o{ AgentRun : has

    User {
        string id PK
        string name
        string email
        string profile "local | supabase"
        datetime createdAt
    }

    Project {
        string id PK
        string name
        string description
        string userId FK
        string stack
        string basePath
        datetime createdAt
        datetime updatedAt
    }

    PlanFile {
        string id PK
        string projectId FK
        string type "PROJECT_PLAN | ROADMAP | MINDMAP | ARCHITECTURE | AGENT_SETUP"
        string content
        string filePath
        datetime generatedAt
    }

    AgentRun {
        string id PK
        string projectId FK
        string workflow "plan | code | review"
        string status "pending | running | success | failed"
        string output
        int stepsUsed
        int tokensUsed
        datetime startedAt
        datetime finishedAt
    }
```

> **Zmiana:** `HermesRun` → `AgentRun`. Dodane `stepsUsed` i `tokensUsed` do śledzenia zużycia.

---

## Key Design Decisions

| Decyzja | Powód |
|---------|-------|
| Markdown jako source of truth | Przenośny, czytelny w każdym edytorze, łatwy do wersjonowania w git |
| markmap + Mermaid zamiast własnego renderera | Dojrzałe biblioteki, działają z Markdown, duża społeczność |
| SQLite na start | Zero konfiguracji, jeden plik, idealne na local-first |
| Monorepo z 5 pakietami | Separacja odpowiedzialności, core współdzielony przez CLI/VSCode/Web |
| TypeScript strict | Type safety, lepsze IDE support, mniej bugów |
| Core jako CJS + ESM dual build | Kompatybilność z CLI (Node) i Web (Vite) |
| **Własny AiClient w core** | Bezpośrednia komunikacja z AI API bez pośrednictwa Hermesa |
| **Hermes jako opcjonalny orchestrator** | Power-userzy mogą używać multi-agent workflowów; reszta działa standalone |
| **Config w ~/.planora/config.json** | Jeden plik, chmod 600, tylko klucz API — nic więcej nie trzeba |
| **Tool-calling przez function calling** | Agent może czytać/ pisać pliki, szukać w necie — wszystko przez natywne API modeli |
