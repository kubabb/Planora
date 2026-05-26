# Planora — Web App Design (React + Vite)

> Status: parts of this document are older than the own-agent direction. Read Hermes-specific screens as historical placeholders; the active product direction is Agent-centric, with Hermes only as an optional addon.

## Overview

Lokalna aplikacja React na `http://localhost:4173`. Używa Vite jako build tool, React Router v6 do routingu, markmap-js do map myśli, Mermaid.js do diagramów.

---

## Tech Stack (Web)

| Biblioteka | Wersja | Przeznaczenie |
|-----------|--------|---------------|
| React | 18+ | UI framework |
| Vite | 5+ | Build tool + dev server |
| TypeScript | 5+ | Type safety |
| React Router | v6 | Client-side routing |
| markmap-js | latest | Mind map rendering |
| mermaid | 10+ | Diagram rendering |
| react-markdown | latest | Markdown → HTML |
| better-sqlite3 | latest | Local DB (via core) |
| Tailwind CSS | 3+ | Utility-first CSS (opcjonalnie) |

---

## Routes

| Path | Component | Opis |
|------|-----------|------|
| `/` | `Dashboard` | Lista projektów użytkownika |
| `/project/:id` | `ProjectView` | Szczegóły projektu (overview, roadmapa) |
| `/project/:id/mindmap` | `MindMapView` | Pełnoekranowa interaktywna mapa myśli |
| `/project/:id/graphs` | `GraphsView` | Diagramy Mermaid |
| `/project/:id/hermes` | `HermesView` | Status Hermesa, modele, runy, logi |
| `/settings` | `SettingsView` | Profil użytkownika, preferencje |

---

## Component Tree

```
<App>
  <BrowserRouter>
    <Layout>
      <Sidebar>          # Nawigacja: Dashboard, Settings
        <UserAvatar />
        <ProjectList />  # Mini-lista projektów (szybki dostęp)
      </Sidebar>
      <MainContent>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/project/:id" element={<ProjectView />} />
          <Route path="/project/:id/mindmap" element={<MindMapView />} />
          <Route path="/project/:id/graphs" element={<GraphsView />} />
          <Route path="/project/:id/hermes" element={<HermesView />} />
          <Route path="/settings" element={<SettingsView />} />
        </Routes>
      </MainContent>
    </Layout>
  </BrowserRouter>
</App>
```

---

## Widoki — szczegóły

### 1. Dashboard (`/`)

```
+--------------------------------------------------+
|  Planora                          [ + New Project ] |
+--------------------------------------------------+
|                                                    |
|  [Search...]                                       |
|                                                    |
|  +------------------+  +------------------+        |
|  | Project A        |  | Project B        |        |
|  | React + Node     |  | Python + FastAPI |        |
|  | Updated: 2h ago  |  | Updated: 1d ago  |        |
|  | [Open] [Delete]  |  | [Open] [Delete]  |        |
|  +------------------+  +------------------+        |
+--------------------------------------------------+
```

**Komponenty:**
- `ProjectCard` — karta projektu (nazwa, stack, data, przyciski)
- `SearchBar` — filtrowanie po nazwie
- `EmptyState` — gdy brak projektów, CTA do `planora init`

**Dane:** `useProjects()` hook → fetch z SQLite przez core API.

---

### 2. Project View (`/project/:id`)

```
+--------------------------------------------------+
|  < Back    Project: MyApp          [Edit] [Delete] |
+--------------------------------------------------+
|  [Overview] [Roadmap] [Mind Map] [Graphs] [Hermes] |
+--------------------------------------------------+
|                                                    |
|  (content of selected tab)                         |
+--------------------------------------------------+
```

**Overview tab:** renderuje PROJECT_PLAN.md przez `react-markdown`
**Roadmap tab:** renderuje ROADMAP.md + opcjonalnie timeline visualization

---

### 3. Mind Map View (`/project/:id/mindmap`)

Pełnoekranowa, interaktywna mapa myśli z MINDMAP.md.

**Implementacja (MindmapRenderer):**
```typescript
import { Markmap } from 'markmap-js';

function MindmapRenderer({ markdown }: { markdown: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const { root } = markmap.Transformer.transform(markdown);
      Markmap.create(ref.current, {}, root);
    }
  }, [markdown]);

  return <div ref={ref} style={{ width: '100%', height: '100%' }} />;
}
```

Funkcje: zoom, pan, collapse/expand nodes, export SVG.

---

### 4. Graphs View (`/project/:id/graphs`)

Renderuje wszystkie bloki ```mermaid z ARCHITECTURE.md.

**Implementacja (MermaidRenderer):**
```typescript
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false, theme: 'default' });

function MermaidRenderer({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const id = useMemo(() => `mermaid-${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    mermaid.render(id, code).then(({ svg }) => {
      if (ref.current) ref.current.innerHTML = svg;
    });
  }, [code, id]);

  return <div ref={ref} />;
}
```

Parsowanie bloków:
```typescript
function extractMermaidBlocks(markdown: string): { title: string; code: string }[] {
  const regex = /```mermaid\n([\s\S]*?)```/g;
  const blocks = [];
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    blocks.push({ title: '', code: match[1].trim() });
  }
  return blocks;
}
```

---

### 5. Hermes View (`/project/:id/hermes`)

```
+--------------------------------------------------+
|  Status: Connected    Provider: OpenRouter         |
|  Model: anthropic/claude-sonnet-4                  |
+--------------------------------------------------+
|  Jobs:                                             |
|  +----------+----------+----------+----------+     |
|  | planner  | coder    | reviewer | custom   |     |
|  | idle     | running  | idle     | idle     |     |
|  +----------+----------+----------+----------+     |
+--------------------------------------------------+
|  Run History:                                      |
|  Timestamp           | Job      | Status  | Output |
|  2026-05-26 18:00    | planner  | success | ...    |
|  2026-05-26 17:30    | coder    | running | ...    |
+--------------------------------------------------+
```

---

## Data Fetching

```typescript
// hooks/useProjects.ts
export function useProjects(userId: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storage = getStorage(); // SQLite adapter
    storage.listProjects(userId).then(setProjects).finally(() => setLoading(false));
  }, [userId]);

  return { projects, loading };
}

// hooks/usePlanFile.ts
export function usePlanFile(projectId: string, type: PlanFileType) {
  const [data, setData] = useState<PlanFile | null>(null);

  useEffect(() => {
    getStorage().getPlanFiles(projectId)
      .then(files => files.find(f => f.type === type))
      .then(setData);
  }, [projectId, type]);

  return { data };
}
```

---

## Stylowanie

Dark theme jako domyślny (spójny z terminalem / VS Code):

```css
:root {
  --bg-primary: #0d1117;
  --bg-secondary: #161b22;
  --text-primary: #c9d1d9;
  --text-secondary: #8b949e;
  --accent: #58a6ff;
  --border: #30363d;
}
```
