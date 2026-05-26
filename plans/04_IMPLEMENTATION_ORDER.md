# Planora — Kolejność Implementacji (Build Order)

> Status: parts of this document are historical. When this file mentions Hermes-first flows, Hermes-specific views, or `HERMES_SETUP.md`, interpret them through `plans/08_OWN_AGENT.md`: Planora standalone first, Hermes optional later.

## Zasady

1. **Każdy krok produkuje działający, testowalny artifact.**
2. **Zależności idą w górę** — to, co niżej, musi działać zanim zbudujemy to, co wyżej.
3. **Minimalna wersja najpierw** — MVP zanim rozbudowa.
4. **Markdown-first** — najpierw generatory .md, potem wizualizacje.

---

## Faza 1: Fundament (M1)

### Krok 1.1 — Root setup
```
Planora/
├── package.json          # name: "planora", private: true, workspaces: ["packages/*"]
├── tsconfig.base.json    # strict, ESNext, moduleResolution: bundler
├── .gitignore
├── .prettierrc
└── .eslintrc.cjs
```

**Weryfikacja:** `npm install` działa, nie ma błędów.

### Krok 1.2 — Pakiety skeleton
Każdy pakiet dostaje:
- `package.json` z nazwą `@planora/<name>`, `"type": "module"`
- `tsconfig.json` rozszerzający `../../tsconfig.base.json`
- `src/index.ts` z `export {}`

**Weryfikacja:** `npm run build` (tsc) przechodzi dla każdego pakietu.

---

## Faza 2: Core — Serce systemu (M2)

### Krok 2.1 — Modele danych
W `packages/core/src/models/`:
```
project.ts     # Project, ProjectStatus enum
user.ts        # User, UserProfileType
plan-file.ts   # PlanFile, PlanFileType enum
hermes-config.ts # HermesConfig, ModelProvider, Job
```

**Weryfikacja:** Importy działają, typy poprawne.

### Krok 2.2 — Storage adapter
```
storage/
├── adapter.ts   # IStorage interface: CRUD dla User, Project, PlanFile
└── sqlite.ts    # implementacja z better-sqlite3
```

Metody:
- `createUser`, `getUser`
- `createProject`, `getProject`, `listProjects(userId)`, `updateProject`
- `savePlanFile`, `getPlanFiles(projectId)`

**Weryfikacja:** Test integracyjny — create + read.

### Krok 2.3 — Generatory plików (najpierw 2, potem reszta)
Kolejność:
1. `planora-json.ts` (najprostszy — JSON)
2. `project-plan.ts` (szablon Markdown)
3. `mindmap.ts` (hierarchiczny outline)
4. `roadmap.ts` (timeline Markdown)
5. `architecture.ts` (Mermaid blocks)
6. `hermes-setup.ts` (opis jobów i modeli)

Każdy generator to funkcja `generate(input: X): string`.

**Weryfikacja:** Każdy generator zwraca niepusty string z poprawnym formatem.

---

## Faza 3: Web App — Minimum Viable (M4, przed CLI!)

> **Dlaczego web przed CLI?** Bo web app może działać z mock data i daje wizualną pewność, że generatory produkują sensowne rzeczy. CLI będzie tylko wrapperem.

### Krok 3.1 — Vite + React scaffold
```bash
cd packages/web
npm create vite@latest . -- --template react-ts
npm install react-router-dom mermaid markmap-js
```

### Krok 3.2 — Routing i Layout
```
src/
├── main.tsx          # ReactDOM.createRoot
├── App.tsx           # <BrowserRouter> + <Routes>
├── components/
│   └── Layout.tsx    # sidebar + content area
└── routes/
    └── Dashboard.tsx  # lista projektów (mock data)
```

**Weryfikacja:** `npm run dev` → `localhost:5173` pokazuje Dashboard.

### Krok 3.3 — Dashboard z real data (przez adapter)
- Import core package
- Fetch projektów z SQLite
- Karta projektu: nazwa, opis, stack, data

### Krok 3.4 — Project View
- Route: `/project/:id`
- Zakładki: Overview, Roadmap, Mind Map, Graphs, Hermes
- Overview pokazuje PROJECT_PLAN.md (parsowany Markdown → HTML)

### Krok 3.5 — Mind Map View
- Import markmap-js
- Fetch MINDMAP.md
- Render jako interaktywna mapa myśli
- Fullscreen mode

### Krok 3.6 — Graphs View
- Import mermaid
- Fetch ARCHITECTURE.md
- Parsuj bloki \`\`\`mermaid
- Render każdy blok jako osobny diagram

### Krok 3.7 — Hermes View (mock na razie)
- Status: disconnected / connected
- Lista modeli
- Lista jobów

---

## Faza 4: CLI (M5)

### Krok 4.1 — Entry point + Commander
```
cli/
└── src/
    └── index.ts  # #!/usr/bin/env node, program.name('planora')
```

### Krok 4.2 — Komendy (w tej kolejności)
1. `planora init` — najprostsza, tylko tworzy `.planora/planora.json`
2. `planora plan` — wywołuje wszystkie 6 generatorów, zapisuje pliki
3. `planora web` — spawn `npm run dev` w packages/web
4. `planora mindmap` — tylko MINDMAP.md
5. `planora roadmap` — tylko ROADMAP.md
6. `planora analyze` — czyta istniejące repo
7. `planora hermes init` — tworzy HERMES_SETUP.md + joby

### Krok 4.3 — Global install
```json
// packages/cli/package.json
{
  "bin": {
    "planora": "./dist/index.js"
  }
}
```

**Weryfikacja:** `npm link` → `planora --help` działa globalnie.

---

## Faza 5: VS Code Extension (M6)

### Krok 5.1 — Extension scaffold
- Standardowy `yo code` albo ręcznie
- `package.json` z `activationEvents`, `contributes.commands`

### Krok 5.2 — Komendy (4 sztuki)
Każda komenda wywołuje odpowiednią funkcję z `@planora/core`:
- `planora.generatePlan`
- `planora.generateRoadmap`
- `planora.generateMindmap`
- `planora.openWebview`

### Krok 5.3 — Webview Panel
- Otwiera iframe z localhost apki React
- Albo embedded render (markmap + mermaid w webview)

---

## Faza 6: Hermes Deep Integration (M7)

### Krok 6.1 — Model config wizard (CLI)
- `planora hermes init` pyta o provider
- Testuje połączenie (curl/ping do endpointu)
- Zapisuje config do SQLite

### Krok 6.2 — Job definitions
Tworzy pliki jobów Hermesa:
```yaml
# ~/.hermes/jobs/planora-planner.yaml
name: planora-planner
trigger: manual
model: openrouter/anthropic/claude-sonnet-4
skills: [planora]
prompt: "Generate a project plan for {project_name}..."
```

### Krok 6.3 — Runner
- `packages/runner/src/job-runner.ts`
- Wywołuje Hermes API
- Zapisuje wynik jako HermesRun w SQLite

### Krok 6.4 — Historia runów w Web App
- HermesView.tsx fetchuje HermesRun[]
- Tabela: job, status, czas, output preview

---

## Quick Reference: Co kiedy budować

```
1. Root monorepo         → M1
2. Core models           → M2
3. Storage (SQLite)      → M2
4. planora.json gen      → M3 (najpierw)
5. PROJECT_PLAN.md gen   → M3
6. MINDMAP.md gen        → M3
7. ROADMAP.md gen        → M3
8. ARCHITECTURE.md gen   → M3
9. HERMES_SETUP.md gen   → M3
10. React app scaffold   → M4
11. Dashboard            → M4
12. Project View         → M4
13. Mind Map View        → M4
14. Graphs View          → M4
15. CLI entry + init     → M5
16. CLI plan             → M5
17. CLI web              → M5
18. CLI pozostałe        → M5
19. VS Code extension    → M6
20. Hermes wizard + joby → M7
21. Hermes run history   → M7
```
