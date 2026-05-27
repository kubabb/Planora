# Plan — Publikacja Planora na npm

> Status: plan
> Data: 2026-05-27

## Cel

Umożliwić instalację Planora przez `npm install -g @planora/cli` (lub `npm install @planora/cli`).

## Analiza obecnego stanu

### Pakiety w monorepo

| Pakiet | `private` | `bin` | Przeznaczenie | Publikować? |
|--------|-----------|-------|--------------|-------------|
| `packages/core` | `true` | — | Modele, generatory, AI client, storage | ✅ TAK |
| `packages/cli` | `true` | `planora` | Commander.js CLI | ✅ TAK |
| `packages/runner` | `true` | — | Agent runtime | ✅ TAK |
| `packages/web` | `true` | — | React app (Vercel) | ❌ NIE |
| `packages/vscode-ext` | `true` | — | VS Code extension | ❌ NIE (później) |

### Problem

npm workspaces不允许 publikować wewnętrznych pakietów jako osobne produkty bez dodatkowej konfiguracji. `@planora/cli` zależy od `@planora/core` i `@planora/runner` przez ścieżkę `*` w workspaces — to działa lokalnie, ale nie po publikacji.

## Wymagania

1. **Zmienić `private: false`** dla pakietów publikowanych
2. **Dodać `publishConfig: { access: "public" }`** dla każdego publikowanego pakietu
3. **Ustawić wersje** — obecnie wszystkie na `0.1.0`
4. **.npmrc** z registry i scope
5. **Build przed publikacją** — dist/ musi być gotowe
6. **Odpiąć web od workspace chain** — web nie może dependować na @planora/* po publikacji bez osobnego release

## Wybór strategii publikacji

### Strategia A: Peer dependencies (rekomendowana)

```json
// @planora/cli/package.json
{
  "dependencies": {
    "@planora/core": "^0.1.0",
    "@planora/runner": "^0.1.0"
  }
}
```

Zalety: niezależne wersje, normalny npm semver.
Wady: wymaga publikacji core i runner osobno.

### Strategia B: Bundle all-in-one

Publikować tylko `@planora/cli` z wbudowanym @planora/core i @planora/runner (jak Turborepo w包装).

Zalety: jedna komenda install.
Wady: duży bundle, trudniejsze aktualizacje.

## Rekomendacja: Strategia A (peer deps)

Publikujemy 3 pakiety niezależnie:
- `@planora/core` (核心)
- `@planora/runner` (zależy od core)
- `@planora/cli` (zależy od core + runner)

web i vscode-ext zostają jako prywatne pakiety do późniejszej publikacji (osobne release train).

## Tasks

### T1: Przygotuj pakiety do publikacji

**T1.1: Zmień `private: false` + dodaj `publishConfig`**

```json
// packages/core/package.json
{
  "name": "@planora/core",
  "version": "0.1.0",
  "private": false,
  "publishConfig": {
    "access": "public"
  },
  ...
}

// packages/runner/package.json
{
  "name": "@planora/runner",
  "version": "0.1.0",
  "private": false,
  "publishConfig": {
    "access": "public"
  },
  "dependencies": {
    "@planora/core": "^0.1.0"
  },
  ...
}

// packages/cli/package.json
{
  "name": "@planora/cli",
  "version": "0.1.0",
  "private": false,
  "publishConfig": {
    "access": "public"
  },
  "bin": {
    "planora": "./dist/index.js"
  },
  "dependencies": {
    "@planora/core": "^0.1.0",
    "@planora/runner": "^0.1.0",
    "commander": "^12.0.0"
  },
  ...
}
```

**T1.2: Zmień dependencies z `*` na semver ranges**

W `packages/cli/package.json`:
```json
"dependencies": {
  "@planora/core": "^0.1.0",
  "@planora/runner": "^0.1.0"
}
```

W `packages/runner/package.json`:
```json
"dependencies": {
  "@planora/core": "^0.1.0"
}
```

**T1.3: W root package.json dodaj publiczną konfigurację**

```json
{
  "name": "planora",
  "private": true,
  "workspaces": [...],
  "publishConfig": {
    "access": "public"
  }
}
```

### T2: Utwórz .npmrc

```ini
# packages/.npmrc
@planora:registry=https://registry.npmjs.org/
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

### T3: Zbuduj dist/

```bash
npm run build:ts
# lub per-package: npm run build --workspace @planora/cli
```

Weryfikacja: `ls packages/*/dist/` — wszystkie pakiety muszą mieć dist/.

### T4: Przygotuj release workflow

**GitHub Actions (`.github/workflows/publish.yml`):**

```yaml
name: Publish to npm

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
          scope: '@planora'
      
      - run: npm ci
      
      - name: Build all packages
        run: npm run build:ts
      
      - name: Publish core
        run: npm publish --workspace @planora/core --access public
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
      
      - name: Publish runner
        run: npm publish --workspace @planora/runner --access public
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
      
      - name: Publish cli
        run: npm publish --workspace @planora/cli --access public
        env:
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### T5: Zmiana wersji (release)

```bash
# bump wersji wszystkich pakietów jednocześnie
npm version patch # 0.1.0 -> 0.1.1
# lub
npm version minor # 0.1.0 -> 0.2.0
```

Dla npm workspaces wersje muszą być spójne — wszystkie pakiety dostają tę samą wersję. Użyj `--workspaces` lub zmień ręcznie w każdym package.json.

## Weryfikacja

1. `npm pack --workspace @planora/cli` — tworzy .tgz, sprawdź czy bin jest w pakiecie
2. `npm install -g ./packages/cli` (lokalnie) — test przed publikacją
3. Po publikacji: `npm install -g @planora/cli` i `planora --version`

## Pliki do zmiany

| Plik | Akcja |
|------|-------|
| `packages/core/package.json` | `private: false` + `publishConfig` |
| `packages/runner/package.json` | `private: false` + `publishConfig` |
| `packages/cli/package.json` | `private: false` + `publishConfig` + dependencies |
| `root package.json` | `publishConfig` |
| `.npmrc` | stwórz |
| `.github/workflows/publish.yml` | stwórz |
| `plans/12_NPM_PUBLISH.md` | ten plik |

## Alternatywy rozważone

1. **Bundle all-in-one**: zbyt duże, utrudnia aktualizacje
2. **Turborepo/pnpm workspaces only**: nie zmienia faktu że pakiety muszą być publiczne do npm publish
3. **Osobne repo per package**: overkill na tym etapie

## Następne kroki po publikacji

1. Ustaw `NPM_TOKEN` w GitHub Secrets
2. Przetestuj `npm install -g @planora/cli` z nowej maszyny
3. Dodaj `postinstall` script jeśli potrzebny (np. generate config)
4. Dokumentuj instalację w README.md (usuwamy "coming soon")