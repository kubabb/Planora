# Planora — CLI & VS Code Extension Spec

## CLI Commands

### `planora init`
```
Inicjalizuje nowy projekt Planora w bieżącym katalogu.

Usage:
  planora init [options]

Options:
  --name <name>        Nazwa projektu
  --desc <desc>        Opis projektu
  --stack <stack>      Tech stack (comma-separated)
  --force              Nadpisz istniejącą konfigurację

Output:
  Tworzy .planora/planora.json
  Tworzy .planora/ (katalog na wygenerowane plany)

Example:
  planora init --name "MyApp" --desc "Aplikacja do X" --stack "react,node,postgres"
```

### `planora plan`
```
Generuje kompletny zestaw plików planistycznych.

Usage:
  planora plan [options]

Options:
  --all                Generuj wszystkie 6 plików (domyślnie)
  --only <type>        Generuj tylko jeden typ: plan|roadmap|mindmap|arch|hermes
  --output <dir>       Katalog wyjściowy (domyślnie: .planora/)
  --ai                 Użyj AI (Hermes) do wygenerowania treści

Output:
  PROJECT_PLAN.md
  ROADMAP.md
  MINDMAP.md
  ARCHITECTURE.md
  HERMES_SETUP.md
  planora.json (aktualizacja metadanych)

Example:
  planora plan --all
  planora plan --only mindmap
  planora plan --ai
```

### `planora analyze`
```
Analizuje istniejące repozytorium i generuje wstępny plan.

Usage:
  planora analyze [options]

Options:
  --path <path>        Ścieżka do repo (domyślnie: cwd)
  --deep               Głęboka analiza (czyta pliki źródłowe)
  --output <dir>       Katalog wyjściowy

Co robi:
  1. Czyta package.json → określa stack
  2. Skanuje strukturę katalogów → określa architekturę
  3. Czyta README.md → wyciąga opis projektu
  4. Sugeruje uzupełnienia
  5. Generuje PROJECT_PLAN.md (draft)

Example:
  planora analyze --path ../my-repo --deep
```

### `planora roadmap`
```
Generuje roadmapę rozwoju projektu.

Usage:
  planora roadmap [options]

Options:
  --phases <n>         Liczba faz (domyślnie: 4)
  --interactive        Tryb interaktywny — pyta o każdą fazę
  --from-plan          Wyciągnij milestone'y z istniejącego PROJECT_PLAN.md

Example:
  planora roadmap --phases 5 --interactive
```

### `planora mindmap`
```
Generuje mapę myśli z hierarchicznego outline.

Usage:
  planora mindmap [options]

Options:
  --depth <n>          Maksymalna głębokość (domyślnie: 4)
  --from-plan          Wygeneruj z istniejącego PROJECT_PLAN.md
  --title <title>      Główny tytuł mapy

Output:
  MINDMAP.md w formacie:
  # Title
  ## Section 1
  ### Sub-section
  - item
  - item
  ## Section 2
  ...

Example:
  planora mindmap --from-plan --title "MyApp Architecture"
```

### `planora hermes init`
```
Przygotowuje środowisko Hermesa dla projektu.

Usage:
  planora hermes init [options]

Options:
  --provider <p>       Provider: openrouter|ollama|opencode|custom
  --model <model>      Nazwa modelu
  --api-key <key>      API key (dla OpenRouter/OpenCode)
  --local-url <url>    URL dla Ollama/custom (domyślnie: http://localhost:11434)

Output:
  HERMES_SETUP.md z definicjami jobów
  ~/.hermes/jobs/planora-*.yaml (joby)
  Aktualizuje planora.json (hermesReady: true)

Example:
  planora hermes init --provider openrouter --model "anthropic/claude-sonnet-4"
  planora hermes init --provider ollama --model "llama3:8b"
```

### `planora web`
```
Uruchamia lokalną aplikację webową Planora.

Usage:
  planora web [options]

Options:
  --port <port>        Port (domyślnie: 4173)
  --open               Otwórz przeglądarkę automatycznie
  --no-open            Nie otwieraj przeglądarki

Example:
  planora web --port 3000 --open
```

---

## VS Code Extension

### Package manifest (`package.json`)
```json
{
  "name": "planora-vscode",
  "displayName": "Planora",
  "description": "Project planning & documentation generator",
  "version": "0.1.0",
  "engines": { "vscode": "^1.85.0" },
  "activationEvents": [],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [
      { "command": "planora.generatePlan", "title": "Planora: Generate Plan" },
      { "command": "planora.generateRoadmap", "title": "Planora: Generate Roadmap" },
      { "command": "planora.generateMindmap", "title": "Planora: Generate Mind Map" },
      { "command": "planora.openWebview", "title": "Planora: Open Project View" },
      { "command": "planora.analyzeProject", "title": "Planora: Analyze This Project" }
    ],
    "menus": {
      "explorer/context": [
        {
          "command": "planora.analyzeProject",
          "group": "navigation",
          "when": "explorerResourceIsFolder"
        }
      ]
    }
  }
}
```

### Commands Implementation

```typescript
// extension.ts
import * as vscode from 'vscode';
import { generatePlan, generateRoadmap, generateMindmap } from '@planora/core';

export function activate(context: vscode.ExtensionContext) {
  // Generate Plan
  context.subscriptions.push(
    vscode.commands.registerCommand('planora.generatePlan', async () => {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        vscode.window.showErrorMessage('No workspace open');
        return;
      }
      await generatePlan(workspaceFolder.uri.fsPath);
      vscode.window.showInformationMessage('Plan generated!');
    })
  );

  // Generate Roadmap
  context.subscriptions.push(
    vscode.commands.registerCommand('planora.generateRoadmap', async () => {
      // ... podobnie
    })
  );

  // Generate Mindmap
  context.subscriptions.push(
    vscode.commands.registerCommand('planora.generateMindmap', async () => {
      // ... podobnie
    })
  );

  // Open Webview
  context.subscriptions.push(
    vscode.commands.registerCommand('planora.openWebview', () => {
      const panel = vscode.window.createWebviewPanel(
        'planora',
        'Planora',
        vscode.ViewColumn.One,
        { enableScripts: true }
      );
      panel.webview.html = getWebviewContent();
    })
  );

  // Analyze Project
  context.subscriptions.push(
    vscode.commands.registerCommand('planora.analyzeProject', async (uri: vscode.Uri) => {
      // Analyze folder at uri.fsPath
    })
  );
}

function getWebviewContent(): string {
  return '<!DOCTYPE html><html><body><iframe src="http://localhost:4173" width="100%" height="100%" frameborder="0" /></body></html>';
}
```

### Status Bar Item
```typescript
const statusBarItem = vscode.window.createStatusBarItem(
  vscode.StatusBarAlignment.Right, 100
);
statusBarItem.text = "$(symbol-ruler) Planora";
statusBarItem.command = 'planora.openWebview';
statusBarItem.show();
```

---

## Integration Points

```
+-------------+     +-------------+     +-------------+
|   VS Code   |     |     CLI     |     |   Web App   |
|  Extension  |     |  (terminal) |     | (localhost) |
+------+------+     +------+------+     +------+------+
       |                   |                   |
       +-------------------+-------------------+
                           |
                    +------v------+
                    |  Core Pkg   |
                    | @planora/   |
                    |    core     |
                    +------+------+
                           |
              +------------+------------+
              |            |            |
       +------v------+ +--v---+ +------v------+
       |  Generators | |Storage| |  Analyzers  |
       +-------------+ +------+ +-------------+
```

Wszystkie trzy interfejsy (CLI, VS Code, Web) używają dokładnie tego samego API z `@planora/core`. Żadna logika biznesowa nie jest duplikowana.
