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
│   │       │   └── hermes-config.ts
│   │       ├── generators/
│   │       │   ├── project-plan.ts
│   │       │   ├── roadmap.ts
│   │       │   ├── mindmap.ts
│   │       │   ├── architecture.ts
│   │       │   ├── hermes-setup.ts
│   │       │   └── planora-json.ts
│   │       ├── storage/
│   │       │   ├── adapter.ts          # interface
│   │       │   ├── sqlite.ts           # SQLite impl
│   │       │   └── supabase.ts         # Supabase impl (future)
│   │       ├── analyzers/
│   │       │   ├── repo-analyzer.ts    # czyta istniejące repo
│   │       │   └── stack-recommender.ts
│   │       └── utils/
│   │           ├── mermaid.ts          # Mermaid block builder
│   │           ├── markdown.ts         # MD utilities
│   │           └── id.ts              # UUID gen
│   │
│   ├── cli/                  # @planora/cli
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts               # entry point
│   │       ├── commands/
│   │       │   ├── init.ts
│   │       │   ├── plan.ts
│   │       │   ├── analyze.ts
│   │       │   ├── roadmap.ts
│   │       │   ├── mindmap.ts
│   │       │   ├── hermes.ts
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
│   │       │   └── HermesView.tsx
│   │       ├── components/
│   │       │   ├── ProjectCard.tsx
│   │       │   ├── MindmapRenderer.tsx
│   │       │   ├── MermaidRenderer.tsx
│   │       │   ├── HermesStatus.tsx
│   │       │   └── Layout.tsx
│   │       ├── hooks/
│   │       │   ├── useProjects.ts
│   │       │   └── useHermesStatus.ts
│   │       └── styles/
│   │           └── globals.css
│   │
│   └── runner/               # @planora/runner
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── hermes-bridge.ts       # komunikacja z Hermes API
│           └── job-runner.ts          # wykonuje joby Hermesa
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
    Web --> Runner

    Core --> Generators[File Generators]
    Core --> Storage[Storage Adapter]
    Core --> Analyzers[Repo Analyzers]

    Generators --> MD[Markdown Files]
    MD --> Mindmap[MINDMAP.md]
    MD --> Arch[ARCHITECTURE.md]
    MD --> Plan[PROJECT_PLAN.md]
    MD --> Roadmap[ROADMAP.md]
    MD --> HermesCfg[HERMES_SETUP.md]

    Storage --> SQLite[(SQLite DB)]
    Runner --> Hermes[Hermes Agent API]
    Hermes --> Jobs[Jobs: planner, coder, reviewer]

    Web --> Markmap[markmap.js]
    Web --> Mermaid[Mermaid.js]
    Markmap --> MindMapView[Mind Map View]
    Mermaid --> GraphsView[Graphs View]
```

---

## Data Model

```mermaid
erDiagram
    User ||--o{ Project : owns
    Project ||--o{ PlanFile : contains
    Project ||--o{ HermesRun : has

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
        string type "PROJECT_PLAN | ROADMAP | MINDMAP | ARCHITECTURE | HERMES_SETUP"
        string content
        string filePath
        datetime generatedAt
    }

    HermesRun {
        string id PK
        string projectId FK
        string jobName "planner | coder | reviewer"
        string status "pending | running | success | failed"
        string output
        datetime startedAt
        datetime finishedAt
    }
```

---

## Data Flow

```mermaid
flowchart LR
    A[User Input] --> B[CLI / VS Code / Web]
    B --> C[Core Package]
    C --> D{Action Type}

    D -->|plan| E[Generators]
    D -->|analyze| F[Repo Analyzer]
    D -->|hermes| G[Hermes Bridge]

    E --> H[Write .md files]
    F --> H
    G --> I[Hermes Agent]
    I --> J[AI Model]
    J --> K[Generated Files]
    K --> H

    H --> L[(SQLite DB)]
    L --> M[Web App reads]
    M --> N[markmap / Mermaid render]
```

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
