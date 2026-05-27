# Planora — Bezpieczeństwo (Plan 09)

> Status: w trakcie implementacji
> Ostatnia aktualizacja: 2025-05-27

## Overview

Ten plan definiuje architekturę bezpieczeństwa Planory — CLI, agent tools, storage, web app, Qdrant i publikacja npm.

---

## 1. Warstwy bezpieczeństwa

| Warstwa | Priorytet | Status |
|---------|-----------|--------|
| **API Keys** — config, maskowanie, gitignore | 🔴 | ✅ zrobione |
| **Agent Tools** — shell injection, path traversal | 🔴 | 🔲 do zrobienia |
| **Storage** — SQLite permissions, SQL injection | 🟡 | 🔲 do zrobienia |
| **Qdrant** — API key, connection security | 🟡 | 🔲 do zrobienia |
| **Web App** — XSS, CSP, CORS | 🟡 | 🔲 do zrobienia |
| **Publikacja npm** — .npmignore, dist/ | 🟡 | 🔲 do zrobienia |
| **CI/CD** — gitleaks, semgrep, codeQL | 🟢 | ✅ zrobione |

---

## 2. API Keys (✅ zrobione)

### 2.1. Config file
- `~/.planora/config.json` — chmod 600
- `~/.planora/qdrant-config.json` — chmod 600
- Oba w `.gitignore`

### 2.2. Maskowanie
- `maskApiKey(key)` — pokazuje `sk-or...****`
- `redactConfig(config)` — zwraca SafeConfig z zamaskowanymi kluczami
- Wszystkie logi CLI używają `redactConfig()` przed wypisaniem

### 2.3. Transmisja
- HTTPS tylko (OpenRouter, OpenAI)
- Localhost tylko dla Ollama

---

## 3. Agent Tools (🔴 krytyczne — do zrobienia)

### 3.1. Shell Injection

**Problem:** `shellTool` używa `exec(command)` bez żadnej walidacji. Agent AI może wykonać dowolną komendę.

**Rozwiązanie:**
```typescript
// Allow-lista bezpiecznych komend
const ALLOWED_COMMANDS = [
  'ls', 'cat', 'head', 'tail', 'wc', 'find', 'grep',
  'npm', 'npx', 'tsc', 'node', 'git',
  'echo', 'mkdir', 'touch', 'cp', 'mv',
];

// Blokada niebezpiecznych
const BLOCKED_PATTERNS = [
  /rm\s+(-rf?|--recursive)/i,  // rm -rf
  /sudo\b/i,
  /curl\b/i,                     // exfiltracja
  /wget\b/i,
  />\s*\/dev\//i,               // nadpisywanie device
  /\|.*sh\b/i,                  // pipe do shella
  /\bchmod\s+777\b/i,
  /\bchown\b/i,
];

function validateCommand(command: string): void {
  const cmd = command.trim();
  const baseCommand = cmd.split(/\s+/)[0];
  
  if (!ALLOWED_COMMANDS.includes(baseCommand)) {
    throw new Error(`Komenda niedozwolona: ${baseCommand}`);
  }
  
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(command)) {
      throw new Error(`Niebezpieczna komenda: ${command}`);
    }
  }
}
```

### 3.2. Path Traversal

**Problem:** `file_read`, `file_write`, `file_list` nie walidują ścieżek. Można czytać/zapisywać poza katalogiem projektu.

**Rozwiązanie:**
```typescript
function resolveSafe(projectDir: string, userPath: string): string {
  const resolved = path.resolve(projectDir, userPath);
  if (!resolved.startsWith(path.resolve(projectDir))) {
    throw new Error(`Path traversal blocked: ${userPath}`);
  }
  return resolved;
}
```

### 3.3. Limity
- Timeout per shell command: 30s
- Max buffer: 8MB
- Max output: 4000 znaków (już jest)

---

## 4. Storage (🟡 do zrobienia)

### 4.1. SQLite
- WAL mode ✅ (już jest)
- Parametryzowane zapytania (NIE string concatenation)
- Plik `.db` w `.gitignore` ✅

### 4.2. SQL Injection
```typescript
// ✅ DOBRZE — prepared statement
db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);

// ❌ ŹLE — string concatenation (nigdy nie używać)
db.prepare(`SELECT * FROM projects WHERE id = '${projectId}'`).get();
```

---

## 5. Qdrant (🟡 do zrobienia)

### 5.1. API Key
- W `~/.planora/qdrant-config.json` (chmod 600)
- Maskowany w logach
- HTTPS tylko

### 5.2. Connection
- Timeout 10s
- Retry z exponential backoff (max 3 próby)
- Fail gracefully — Qdrant jest non-critical

---

## 6. Web App (🟡 do zrobienia)

### 6.1. XSS Prevention
- React domyślnie escapuje JSX ✅
- `dangerouslySetInnerHTML` tylko dla zaufanego Markdown
- Sanityzacja Markdown → HTML (DOMPurify)

### 6.2. CSP Headers
```html
<meta http-equiv="Content-Security-Policy" 
  content="default-src 'self'; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net; style-src 'self' 'unsafe-inline';">
```

### 6.3. CORS
- Web app działa tylko na localhost
- Żadne zewnętrzne zapytania z przeglądarki
- API proxy przez Vite dev server

---

## 7. Publikacja npm (🟡 do zrobienia)

### 7.1. .npmignore
Plik `.npmignore` w każdym pakiecie, który jawnie deklaruje co NIE idzie do npm:

```
src/
tests/
tsconfig.json
node_modules/
.env
*.log
```

### 7.2. Dist-only publish
- `"files": ["dist/"]` w każdym `package.json`
- `.gitignore` ignoruje `dist/`, ale `.npmignore` NIE
- Build przed publish: `npm run build && npm publish`

---

## 8. CI/CD Security (✅ zrobione)

### 8.1. Pipeline
- CI: test + build na push/PR
- Security audit: gitleaks + trufflehog + semgrep + codeQL
- Pre-push hook: npm audit + gitleaks

### 8.2. Gitleaks config
- Allowlist tylko dla `test/`, `spec/`, `fixtures/`
- `.github/` NIE w allowlist

---

## 9. Testy bezpieczeństwa (🔲 do zrobienia)

- [ ] Unit testy dla `validateCommand()` — allow-lista i blokady
- [ ] Unit testy dla `resolveSafe()` — path traversal
- [ ] Test że `maskApiKey` nigdy nie zwraca pełnego klucza
- [ ] Test że `redactConfig` nie zawiera surowych kluczy
- [ ] Test że shell tool blokuje `rm -rf`, `curl`, `sudo`
- [ ] Test że file tools blokują `../../../`

---

## 10. Checklist bezpieczeństwa przed v1.0

- [ ] Shell injection: allow-lista + blocked patterns
- [ ] Path traversal: resolveSafe() we wszystkich file tools
- [ ] SQL injection: audit wszystkich zapytań
- [ ] Qdrant: API key w config, maskowany
- [ ] Web: CSP headers, DOMPurify
- [ ] npm: .npmignore w każdym pakiecie
- [ ] CI: wszystkie security joby przechodzą
- [ ] Testy bezpieczeństwa: min. 10 testów
