# Planora — Własny Agent AI (Plan 08)

> **Dla Hermesa:** Użyj subagent-driven-development do implementacji tego planu task-by-task.

**Goal:** Planora ma własnego agenta AI — użytkownik podaje tylko klucz API, Planora sama zarządza promptami, modelami, providerami i wykonuje zadania (planowanie, generowanie kodu, review) BEZ zależności od Hermes Agent.

**Architecture:** `@planora/core` dostaje warstwę `src/ai/` z bezpośrednim klientem LLM (OpenRouter, OpenAI, Ollama, OpenCode). `@planora/runner` przekształca się z "hermes-bridge" w silnik agenta Planory — zarządza sesjami, promptami, tool-callingiem i workflowami. Hermes zostaje jako **opcjonalny** orchestrator do złożonych multi-agent workflowów (planner → coder → reviewer z subagentami).

**Tech Stack:** TypeScript, OpenAI-compatible API, Zod (structured output), SQLite (run history)

---

## 1. Aktualny stan i problem

```
OBECNY FLOW (zależny od Hermesa):
  Planora → @planora/runner → spawn('hermes', ['run', '--job', ...]) → Hermes Agent → AI API
                                                                    ↑
                                                          User MUSI mieć Hermesa

NOWY FLOW (własny agent):
  Planora → @planora/runner → AiClient (core/src/ai/) → AI API (OpenRouter / OpenAI / Ollama)
              ↑                        ↑
     Silnik agenta           Bezpośredni klient LLM
     (prompty, tool-call,    (fetch do REST API)
      workflowy)

  User podaje TYLKO: API key + provider + model
  Zapis: ~/.planora/config.json (chmod 600)
```

**Kluczowa zmiana:** Hermes przestaje być wymagany. User nie musi go instalować, konfigurować ani rozumieć. Planora działa standalone.

---

## 2. Architektura własnego agenta

### 2.1. AiClient — warstwa komunikacji z LLM (`packages/core/src/ai/`)

```
packages/core/src/ai/
├── types.ts              # AiConfig, AiMessage, AiResponse, AiStreamEvent
├── client.ts             # AiClient interface
├── openai-compatible.ts  # Bazowa implementacja OpenAI-compatible (fetch)
├── openrouter.ts         # OpenRouter (dziedziczy openai-compatible)
├── openai.ts             # Direct OpenAI (dziedziczy openai-compatible)
├── ollama.ts             # Ollama (dziedziczy openai-compatible)
├── opencode.ts           # OpenCode (dziedziczy openai-compatible)
├── factory.ts            # createAiClient(config) → AiClient
├── errors.ts             # AiError, RateLimitError, AuthError, etc.
├── retry.ts              # Retry logic z exponential backoff
└── index.ts              # barrel
```

```typescript
// types.ts
interface AiConfig {
  provider: 'openrouter' | 'openai' | 'ollama' | 'opencode' | 'openai-compatible';
  apiKey: string;
  model: string;
  baseUrl?: string;          // dla Ollama / custom providerów
  temperature?: number;      // default: 0.7
  maxTokens?: number;        // default: 4096
  timeout?: number;          // default: 120000 (2 min)
}

interface AiMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;             // dla tool messages
  toolCallId?: string;       // dla tool responses
  toolCalls?: AiToolCall[];  // dla assistant messages z tool calls
}

interface AiToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;       // JSON string
  };
}

interface AiResponse {
  content: string;
  toolCalls?: AiToolCall[];
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: 'stop' | 'tool_calls' | 'length' | 'content_filter';
}

// client.ts
interface AiClient {
  /** Generuje odpowiedź tekstową (bez tool calling) */
  generate(
    messages: AiMessage[],
    config: AiConfigOverrides
  ): Promise<AiResponse>;

  /** Generuje z obsługą tool-calling (function calling) */
  generateWithTools(
    messages: AiMessage[],
    tools: AiTool[],
    config: AiConfigOverrides
  ): Promise<AiResponse>;

  /** Generuje structured output (JSON Schema / Zod) */
  generateStructured<T>(
    messages: AiMessage[],
    schema: ZodSchema<T>,
    config: AiConfigOverrides
  ): Promise<T>;

  /** Generuje streaming (async iterable) */
  generateStream(
    messages: AiMessage[],
    config: AiConfigOverrides
  ): AsyncIterable<AiStreamEvent>;

  /** Test połączenia */
  testConnection(): Promise<{ ok: boolean; model: string; latency: number }>;
}
```

### 2.2. Agent Engine — silnik agenta (`packages/runner/src/`)

Runner przestaje być "hermes-bridge" — staje się silnikiem własnego agenta Planory.

```
packages/runner/src/
├── index.ts                # barrel
├── agent.ts                # Agent class — główna klasa
├── session.ts              # AgentSession — zarządza konwersacją
├── prompts/
│   ├── planner.ts          # Prompt dla planisty (generowanie planów)
│   ├── coder.ts            # Prompt dla kodera (implementacja)
│   ├── reviewer.ts         # Prompt dla reviewera (code review)
│   └── system.ts           # Bazowy system prompt Planory
├── tools/
│   ├── index.ts            # Rejestr tooli
│   ├── file-read.ts        # Czytanie plików
│   ├── file-write.ts       # Zapisywanie plików
│   ├── file-list.ts        # Listowanie katalogów
│   ├── shell.ts            # Wykonywanie komend (sandboxed)
│   ├── web-search.ts       # SearXNG search
│   └── web-fetch.ts        # Pobieranie URL
├── workflows/
│   ├── plan-workflow.ts    # Workflow: planowanie projektu
│   ├── code-workflow.ts    # Workflow: implementacja feature'a
│   └── review-workflow.ts  # Workflow: code review
├── history.ts              # Run history (SQLite)
└── config.ts               # Config loader (~/.planora/config.json)
```

```typescript
// agent.ts
class PlanoraAgent {
  constructor(
    private client: AiClient,
    private tools: AgentTool[],
    private config: AgentConfig
  ) {}

  /** Uruchamia agenta z danym workflowem */
  async run(workflow: Workflow, input: WorkflowInput): Promise<WorkflowOutput>;

  /** Pojedynczy krok: think → act → observe */
  private async step(session: AgentSession): Promise<StepResult>;

  /** Wykonuje tool call */
  private async executeTool(call: AiToolCall): Promise<string>;
}

// session.ts
class AgentSession {
  messages: AiMessage[];
  projectId: string;
  runId: string;
  startedAt: Date;

  addSystem(prompt: string): void;
  addUser(content: string): void;
  addAssistant(content: string, toolCalls?: AiToolCall[]): void;
  addToolResult(toolCallId: string, result: string): void;
  getContextWindow(): AiMessage[];  // ostatnie N wiadomości mieszczące się w token limicie
}

// workflows/plan-workflow.ts
const planWorkflow: Workflow = {
  name: 'plan',
  description: 'Generate project plan, mindmap, and architecture docs',
  steps: [
    { role: 'system', template: 'planner-system' },
    { role: 'user', template: 'planner-input' },
    { role: 'agent', maxSteps: 10, tools: ['file-write', 'web-search'] },
    { role: 'verify', check: 'all-files-generated' },
  ],
};
```

### 2.3. Config System — konfiguracja agenta

```json
// ~/.planora/config.json (chmod 600, NIGDY nie commitować)
{
  "version": 1,
  "providers": {
    "default": "openrouter",
    "openrouter": {
      "apiKey": "sk-or-v1-...",
      "model": "anthropic/claude-sonnet-4",
      "temperature": 0.7,
      "maxTokens": 4096
    }
  },
  "preferences": {
    "language": "pl",
    "autoApprove": false,
    "maxSteps": 10
  }
}
```

```typescript
// packages/core/src/config/types.ts
interface PlanoraConfig {
  version: number;
  providers: Record<string, ProviderConfig>;
  preferences: UserPreferences;
}

interface ProviderConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
}
```

---

## 3. CLI — komendy użytkownika

```
planora config              # Otwiera wizard konfiguracji
planora config show          # Pokazuje obecną konfigurację (bez apiKey)
planora config test          # Testuje połączenie z AI
planora config set <key> <value>  # Ustawia pojedynczą wartość

planora plan --ai           # Generuje plan używając własnego agenta
planora plan                # Generuje plan używając szablonów (bez AI)

planora agent status        # Status agenta: provider, model, połączenie
planora agent history       # Historia runów agenta
```

### Wizard konfiguracji (pierwsze uruchomienie)

```
$ planora config

  ╔══════════════════════════════════════╗
  ║       Planora — AI Setup            ║
  ╚══════════════════════════════════════╝

  Planora używa AI do generowania planów projektów.
  Potrzebny jest tylko klucz API do wybranego providera.
  Klucz jest przechowywany lokalnie i NIGDY nie opuszcza Twojego komputera.

? Wybierz providera AI:
  > OpenRouter (rekomendowany — dostęp do 200+ modeli)
    OpenAI (bezpośrednio)
    Ollama (lokalnie — darmowy, prywatny)
    OpenCode (cloud)
    Inny (OpenAI-compatible)

? Podaj klucz API: ********

  Klucz API zostanie zapisany w ~/.planora/config.json
  Plik ma uprawnienia 0600 — tylko Ty masz do niego dostęp.

? Domyślny model:
  > anthropic/claude-sonnet-4 (rekomendowany)
    openai/gpt-4o
    google/gemini-2.0-flash
    anthropic/claude-opus-4
    Wpisz własny...

? Sprawdzić połączenie? (Y/n): y

  ⏳ Testowanie połączenia z OpenRouter...
  ✓ Połączono! Model: anthropic/claude-sonnet-4
    Latency: 320ms

  ✓ Konfiguracja zapisana.
  Planora jest gotowa do użycia z AI.

  Spróbuj: planora plan --ai
```

---

## 4. Flow użycia — krok po kroku

### 4.1. Pierwsze użycie

```
1. User instaluje Planorę:       npm install -g planora
2. User konfiguruje AI:          planora config
   → Podaje klucz API OpenRouter
   → Wybiera model
   → Testuje połączenie
3. User tworzy projekt:          planora init
4. User generuje plan z AI:      planora plan --ai
   → Agent tworzy PROJECT_PLAN.md, MINDMAP.md, ARCHITECTURE.md
5. User ogląda w web:            planora web
```

### 4.2. Codzienne użycie

```
1. User pracuje nad kodem
2. Chce wygenerować roadmapę:    planora roadmap --ai
3. Chce przeanalizować repo:     planora analyze --ai
4. Wszystko działa bez Hermesa
```

---

## 5. Bezpieczeństwo

| Warstwa | Mechanizm |
|---------|-----------|
| **Plik config** | `~/.planora/config.json`, chmod 600 |
| **gitignore** | `~/.planora/` dodany do global `.gitignore` |
| **Logi** | API key NIGDY nie logowany; maskowany jako `sk-...****` |
| **Pamięć** | Klucz trzymany tylko w pamięci procesu, nigdy na dysku poza configiem |
| **Transmisja** | HTTPS tylko (OpenRouter/OpenAI), localhost dla Ollama |
| **Walidacja** | Test połączenia przed pierwszym użyciem — jeśli klucz nieważny, agent nie ruszy |

---

## 6. Providerzy — szczegóły implementacji

### 6.1. OpenRouter (rekomendowany)

```typescript
class OpenRouterClient extends OpenAICompatibleClient {
  protected baseUrl = 'https://openrouter.ai/api/v1';
  protected headers = {
    'HTTP-Referer': 'https://planora.dev',
    'X-Title': 'Planora',
  };
}
```

**Klucz API:** `sk-or-v1-...` — auto-detekcja po prefiksie.

### 6.2. OpenAI

```typescript
class OpenAIClient extends OpenAICompatibleClient {
  protected baseUrl = 'https://api.openai.com/v1';
}
```

### 6.3. Ollama (lokalny)

```typescript
class OllamaClient extends OpenAICompatibleClient {
  protected baseUrl = 'http://localhost:11434/v1';  // konfigurowalne
  // Bez apiKey — lokalny serwer
}
```

### 6.4. OpenAI-compatible (generic)

```typescript
class GenericOpenAICompatibleClient extends OpenAICompatibleClient {
  constructor(config: AiConfig) {
    super(config.baseUrl!);  // baseUrl wymagany
  }
}
```

---

## 7. Tool system (function calling)

Agent Planory może używać narzędzi przez OpenAI function-calling:

```typescript
interface AgentTool {
  name: string;
  description: string;
  parameters: JsonSchema;
  execute(args: Record<string, unknown>): Promise<string>;
}

// Rejestr tooli
const tools: AgentTool[] = [
  {
    name: 'read_file',
    description: 'Read a file from the project',
    parameters: { path: { type: 'string' } },
    execute: async ({ path }) => fs.readFile(path, 'utf-8'),
  },
  {
    name: 'write_file',
    description: 'Write content to a file',
    parameters: { path: { type: 'string' }, content: { type: 'string' } },
    execute: async ({ path, content }) => {
      await fs.writeFile(path, content);
      return `File written: ${path}`;
    },
  },
  {
    name: 'web_search',
    description: 'Search the web for information',
    parameters: { query: { type: 'string' } },
    execute: async ({ query }) => {
      // Używa SearXNG
      const results = await searxng.search(query);
      return JSON.stringify(results);
    },
  },
];
```

---

## 8. Agent Workflow — szczegółowy

### 8.1. Plan workflow

```
1. Agent dostaje: nazwa projektu, opis, stack
2. System prompt: "Jesteś architektem oprogramowania. Wygeneruj plan projektu."
3. Agent myśli → decyduje co zrobić
4. Agent może:
   - wyszukać w necie podobne rozwiązania (web_search)
   - przeanalizować istniejące pliki (read_file)
   - zapisać wygenerowane pliki (write_file)
5. Agent produkuje:
   - PROJECT_PLAN.md
   - MINDMAP.md
   - ARCHITECTURE.md
   - ROADMAP.md
6. Weryfikacja: czy wszystkie pliki istnieją i mają poprawną zawartość?
```

### 8.2. Loop agenta

```typescript
async run(workflow: Workflow, input: WorkflowInput): Promise<WorkflowOutput> {
  const session = new AgentSession(this.config);
  session.addSystem(workflow.systemPrompt);

  let stepCount = 0;
  const maxSteps = this.config.maxSteps || 10;

  while (stepCount < maxSteps) {
    stepCount++;

    // 1. Wyślij kontekst do AI
    const response = await this.client.generateWithTools(
      session.getContextWindow(),
      this.tools.map(t => t.schema),
      this.config
    );

    // 2. Jeśli AI chce coś powiedzieć (tekst) — zapisz
    if (response.content) {
      session.addAssistant(response.content);
      this.emit('thinking', response.content);
    }

    // 3. Jeśli AI chce użyć narzędzi — wykonaj
    if (response.toolCalls?.length) {
      for (const call of response.toolCalls) {
        this.emit('tool-call', call.function.name);

        try {
          const result = await this.executeTool(call);
          session.addToolResult(call.id, result);
        } catch (error) {
          session.addToolResult(call.id, `Error: ${error.message}`);
        }
      }
      // Po tool callach — wróć do kroku 1 (AI przeanalizuje wyniki)
      continue;
    }

    // 4. Brak tool calls → agent skończył
    break;
  }

  // 5. Zapisz run do historii
  await this.history.save(session);
  return session.buildOutput();
}
```

---

## 9. Integracja z VS Code (future — M6+)

```
VS Code Extension
  ├── Settings: planora.apiKey, planora.provider, planora.model
  ├── Status Bar: Planora agent status (connected/disconnected/model name)
  ├── Command Palette:
  │   ├── Planora: Configure AI...        → otwiera wizard w webview
  │   ├── Planora: Generate Plan (AI)     → plan --ai
  │   └── Planora: Agent Status           → pokazuje status
  └── Webview: ten sam wizard co CLI, ale w UI
```

---

## 10. Co się dzieje z Hermesem?

Hermes **nie jest usuwany**. Staje się opcjonalnym orchestratorem:

| Scenariusz | Mechanizm |
|-----------|-----------|
| **Podstawowe planowanie** | Własny agent Planory (AiClient → AI API) |
| **Pojedyncze zadania AI** | Własny agent Planory |
| **Złożone multi-agent workflow** | Hermes jako orchestrator (planner → coder → reviewer z subagentami) |
| **User bez Hermesa** | Wszystko działa przez własnego agenta |

```typescript
// packages/runner/src/index.ts
export class PlanoraRunner {
  private agent: PlanoraAgent;
  private hermesOrchestrator?: HermesOrchestrator;  // opcjonalny

  async plan(input: PlanInput): Promise<PlanOutput> {
    // Domyślnie: własny agent
    if (input.useHermes && this.hermesOrchestrator) {
      return this.hermesOrchestrator.plan(input);
    }
    return this.agent.run(planWorkflow, input);
  }
}
```

---

## 11. Zmiany w istniejących planach

### 11.1. M2 (Core) — DODAĆ

- [ ] `packages/core/src/ai/` — warstwa AiClient
- [ ] `packages/core/src/config/` — types + loader config
- [ ] `PlanoraConfig` model zamiast `HermesConfig`

### 11.2. M3 (Generatory) — ZMIANA

- [ ] `HermesSetupGenerator` → `AgentSetupGenerator` (generuje AGENT_SETUP.md zamiast HERMES_SETUP.md)

### 11.3. M5 (CLI) — ZMIANA

- [ ] `planora hermes *` → `planora config *` + `planora agent *`
- [ ] `planora plan --ai` używa własnego agenta

### 11.4. M7 (Hermes) — PRZEMIANOWAĆ

- [ ] M7: "Opcjonalna integracja z Hermesem" (zamiast "Hermes Deep Integration")
- [ ] Hermes jako opcjonalny orchestrator dla power-userów
- [ ] `planora hermes init` → konfiguruje Hermesa jako DODATKOWĄ opcję

---

## 12. Task List (implementacja)

### Phase 1: Core — AiClient (M2)

```
Task 1:  Stwórz types.ts — AiConfig, AiMessage, AiResponse, AiStreamEvent
Task 2:  Stwórz errors.ts — AiError, RateLimitError, AuthError
Task 3:  Stwórz retry.ts — exponential backoff, max 3 retries
Task 4:  Stwórz openai-compatible.ts — bazowa implementacja (fetch do /v1/chat/completions)
Task 5:  Stwórz openrouter.ts — OpenRouter client
Task 6:  Stwórz openai.ts — Direct OpenAI client
Task 7:  Stwórz ollama.ts — Ollama client
Task 8:  Stwórz factory.ts — createAiClient(config)
Task 9:  Stwórz testy jednostkowe AiClient (mock fetch)
Task 10: Stwórz test integracyjny z OpenRouter (z kluczem z env)
```

### Phase 2: Config System (M2)

```
Task 11: Stwórz config/types.ts — PlanoraConfig, ProviderConfig
Task 12: Stwórz config/loader.ts — read/write ~/.planora/config.json
Task 13: Stwórz config/validator.ts — walidacja configu + test połączenia
Task 14: Stwórz testy config loadera
```

### Phase 3: Agent Engine (M2/M5)

```
Task 15: Stwórz runner/src/session.ts — AgentSession
Task 16: Stwórz runner/src/prompts/system.ts — bazowy system prompt
Task 17: Stwórz runner/src/prompts/planner.ts — prompt planisty
Task 18: Stwórz runner/src/tools/ — rejestr tooli (file-read, file-write, shell)
Task 19: Stwórz runner/src/agent.ts — główna pętla agenta (think → act → observe)
Task 20: Stwórz runner/src/workflows/plan-workflow.ts
Task 21: Stwórz runner/src/history.ts — zapis runów do SQLite
```

### Phase 4: CLI — komendy (M5)

```
Task 22: Stwórz cli/src/commands/config.ts — wizard konfiguracji
Task 23: Stwórz cli/src/commands/agent.ts — agent status, history
Task 24: Zaktualizuj cli/src/commands/plan.ts — dodaj flagę --ai
Task 25: Stwórz testy CLI (mock AiClient)
```

### Phase 5: VS Code (M6)

```
Task 26: Dodaj settings do package.json extension
Task 27: Stwórz webview wizard konfiguracji
Task 28: Dodaj status bar
```

---

## 13. Verification

- [ ] `npm run build` przechodzi we wszystkich pakietach
- [ ] `npm test` przechodzi (mockowane testy AiClient)
- [ ] `planora config` odpala wizard i zapisuje config
- [ ] `planora config test` zwraca "✓ Connected" lub "✗ Failed"
- [ ] `planora plan --ai` generuje plany używając własnego agenta
- [ ] `planora agent status` pokazuje provider, model, latency
- [ ] API key NIGDY nie pojawia się w logach ani output
- [ ] `~/.planora/config.json` ma chmod 600
- [ ] Plan działa BEZ Hermesa (hermes nie jest zainstalowany)
