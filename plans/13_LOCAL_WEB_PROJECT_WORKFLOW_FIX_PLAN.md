# Plan naprawy: local web, odczyt plikow, grafy, podwojne pytanie o nazwe, porzadek katalogow

## Cel

Doprowadzic Planore do przewidywalnego flow:

1. `planora init` tworzy jeden katalog projektu i zapisuje metadane w jednym standardzie.
2. `planora plan` zawsze zapisuje plan w katalogu projektu, nie luzem w cwd.
3. `planora plan --ai` ma ten sam kontrakt zapisu co statyczny generator.
4. `planora web` na localhost poprawnie widzi projekt z SQLite, czyta pliki projektu i renderuje Mind Map oraz Graphs.
5. CLI nie pyta drugi raz o nazwe projektu, jezeli projekt da sie wykryc z `.planora/planora.json` albo jezeli nazwa zostala podana przez opcje.
6. Web pokazuje konkretne bledy diagnostyczne zamiast ogolnego "brak pliku", gdy problemem jest zly `base_path`, brak metadanych albo brak plikow.

## Najwazniejsza diagnoza

Obecny kod ma kilka niespojnych kontraktow:

1. `packages/cli/src/commands/init.ts`
   - Tworzy `projectDir/.planora/planora.json`.
   - Rejestruje projekt w SQLite z `basePath: projectDir`.
   - To jest sensowny kierunek.

2. `packages/cli/src/commands/plan.ts`
   - Wykrywa projekt tylko z `process.cwd()/.planora/planora.json`.
   - Statyczny `generateStatic()` tworzy `projectDir = path.join(outputDir, name)`.
   - Statyczny `generateStatic()` zapisuje `planora.json` w `projectDir/planora.json`, a nie w `projectDir/.planora/planora.json`.
   - Jezeli jestes juz w katalogu projektu i odpalisz `planora plan`, moze stworzyc zagniezdzony katalog `projectName/projectName`.
   - Jezeli jestes poza projektem i odpalisz `planora plan`, tworzy katalog, ale metadane sa inne niz przy `init`.

3. `generateWithAi()` w `packages/cli/src/commands/plan.ts`
   - Do agenta przekazuje `outputDir`, nie docelowy `projectDir`.
   - Prompt mowi agentowi: "zapisz w katalogu: outputDir".
   - To moze powodowac "syf w plikach", bo AI zapisuje `PROJECT_PLAN.md`, `ARCHITECTURE.md` itd. bezposrednio w cwd albo w katalogu podanym przez `--output`, zamiast w folderze projektu.
   - Po sukcesie SQLite dostaje `basePath: path.join(outputDir, name)`, ale pliki mogly powstac w `outputDir`. Web potem szuka plikow w innym miejscu niz zostaly zapisane.

4. `packages/cli/src/commands/web.ts`
   - API `/api/projects/:id/file/:filename` czyta plik z `project.base_path`.
   - Jezeli SQLite `base_path` nie zgadza sie z realnym miejscem zapisu, web zwraca 404.
   - Frontend pokazuje wtedy "Brak planu" / "Brak diagramow", ale nie pokazuje realnej sciezki i przyczyny.

5. `packages/web/src/dashboard/pages/GraphsView.tsx`
   - Pobiera tylko `ARCHITECTURE.md`.
   - Szuka blokow tylko regexem ` ```mermaid\n...``` `.
   - Jezeli blok ma `\r\n`, spacje po `mermaid`, albo inny case, grafy nie wejda.
   - Renderowanie Mermaid nie lapie bledu per diagram. Jeden wadliwy blok moze popsuc caly widok.

6. `packages/web/src/dashboard/pages/MindMapView.tsx`
   - Tworzy Markmap, ale nie czysci poprzedniej instancji przy zmianie projektu.
   - Przy re-renderach moze zostawic stary stan albo miec problem z dopasowaniem rozmiaru.

## Docelowy kontrakt katalogow

Ustalic jeden standard i trzymac go wszedzie:

```text
<workspace>/<project-name>/
  .gitignore
  .planora/
    planora.json
  PROJECT_PLAN.md
  ROADMAP.md
  MINDMAP.md
  ARCHITECTURE.md
  AGENT_SETUP.md
```

SQLite:

```text
projects.base_path = absolutna sciezka do <workspace>/<project-name>
projects.name = project-name
projects.description = opis usera
projects.stack = JSON albo string, ale jeden format w calym kodzie
```

Wazne: `PROJECT_PLAN.md`, `ROADMAP.md`, `MINDMAP.md`, `ARCHITECTURE.md`, `AGENT_SETUP.md` maja byc w katalogu projektu, nie w `.planora/`. `.planora/` trzyma metadane i rzeczy prywatne.

## Faza 1: Ujednolicenie wykrywania projektu

Pliki:

- `packages/cli/src/commands/plan.ts`
- potencjalnie nowy helper w `packages/cli/src/commands/helpers.ts`
- testy w `packages/core` lub nowy test CLI, jezeli repo ma juz setup pod CLI

Zrobic helper:

```ts
type ProjectContext = {
  projectDir: string;
  metadataPath: string;
  exists: boolean;
  id?: string;
  name?: string;
  description?: string;
  stack?: string;
  timeline?: string;
};
```

Algorytm:

1. Wez `cwd = process.cwd()`.
2. Jezeli istnieje `cwd/.planora/planora.json`, traktuj `cwd` jako istniejacy katalog projektu.
3. Jezeli `--output` podano i `--name` podano, docelowy katalog to `path.resolve(output, safeProjectSlug(name))`.
4. Jezeli nie ma metadanych i jest `--name`, tworz nowy katalog projektu pod `--output` albo `.`.
5. Jezeli nie ma metadanych i nie ma `--name`, dopiero wtedy pytaj o nazwe.
6. Nigdy nie tworz `cwd/name`, jezeli `cwd/.planora/planora.json` wskazuje ten sam projekt.

Acceptance:

- Bedac w `MyApp/` z `MyApp/.planora/planora.json`, `planora plan` nie pyta o nazwe i nie tworzy `MyApp/MyApp/`.
- Bedac poza projektem, `planora plan -n MyApp ...` tworzy `./MyApp/`.
- Bedac poza projektem, `planora plan` pyta o nazwe tylko raz.

## Faza 2: Naprawa statycznego `planora plan`

Plik:

- `packages/cli/src/commands/plan.ts`

Zmiany:

1. `generateStatic()` ma przyjmowac `projectDir`, nie samo `outputDir`.
2. `projectDir` ma byc absolutny.
3. Zawsze tworz `projectDir/.planora`.
4. `planora.json` zapisuj tylko w `projectDir/.planora/planora.json`.
5. Opcjonalnie, dla kompatybilnosci, jezeli istnieje stary `projectDir/planora.json`, nie nadpisuj go bez potrzeby; najlepiej przeniesc logike odczytu do `.planora` i zostawic stary plik jako legacy.
6. Wszystkie plan files zapisuj w `projectDir`.
7. SQLite `basePath` ustawiaj na ten sam `projectDir`.
8. Jezeli projekt juz istnieje w SQLite, nie rob `INSERT`, tylko dodaj metode upsert albo obsluz konflikt. Obecne `createProject()` robi zwykle `INSERT`, wiec drugi run moze wpasc w catch i ukryc blad.

Acceptance:

- Po `planora plan -n TestApp -d "x" -s "React" -t "2 tygodnie"` istnieje `TestApp/.planora/planora.json` i pliki planu w `TestApp/`.
- `TestApp/planora.json` nie powstaje jako nowy plik.
- Dashboard pokazuje projekt i pliki bez recznej poprawki DB.

## Faza 3: Naprawa `planora plan --ai`

Pliki:

- `packages/cli/src/commands/plan.ts`
- `packages/runner/src/agent.ts`
- `packages/runner/src/tools/index.ts`
- `packages/runner/src/prompts/planner.ts`

Problem glowny:

Agent dostaje `outputDir`, a powinien dostac docelowy `projectDir`. Narzedzie `file_write` przyjmuje tylko wzgledne sciezki i zapisuje wzgledem procesu, wiec prompt moze nie wystarczyc.

Preferowana naprawa:

1. W CLI oblicz `projectDir` przed uruchomieniem agenta.
2. Utworz `projectDir` i `projectDir/.planora` przed agentem.
3. Przekaz agentowi `outputDir: projectDir`.
4. W promptach jasno napisac:
   - zapisuj pliki jako sciezki wzgledne od katalogu roboczego agenta albo jako `projectSlug/PROJECT_PLAN.md`, zalezy od implementacji narzedzia.
5. Lepsze technicznie: dodac do `PlanoraAgent.plan()` `projectDir` i do narzedzi bazowy katalog sesji.
6. `file_write` powinien walidowac sciezke wzgledem `baseDir`, nie wzgledem przypadkowego cwd procesu.

Najbezpieczniejszy wariant implementacyjny:

- Dodac do `AgentSession` albo `PlanoraAgent` `workspaceRoot`.
- `file_write.execute(args, context)` albo fabryka narzedzi `getToolSchemas(baseDir)` / `getTool(name, baseDir)`.
- `validatePath()` ma:
  - pozwolic na relatywne sciezki,
  - znormalizowac do `path.resolve(baseDir, userPath)`,
  - sprawdzic, ze wynik nadal jest wewnatrz `baseDir`,
  - blokowac absolutne sciezki i `..`.
- AI planner ma dostawac instrukcje: zapisuj dokladnie `PROJECT_PLAN.md`, `ROADMAP.md`, `MINDMAP.md`, `ARCHITECTURE.md`, `AGENT_SETUP.md`, bez prefiksow katalogu.

Acceptance:

- `planora plan --ai -n TestApp ...` tworzy `TestApp/PROJECT_PLAN.md`, `TestApp/ARCHITECTURE.md` itd.
- Nie tworzy plikow planu w root repo ani w `packages/cli`.
- Web API czyta te pliki przez `base_path`.

## Faza 4: Naprawa web API odczytu plikow

Plik:

- `packages/cli/src/commands/web.ts`

Zmiany:

1. Dekoduj filename:
   - `const requestedFile = decodeURIComponent(fileMatch[2]);`
2. Uzywaj `pathResolve(basePath, requestedFile)`, nie `pathResolve(join(project.base_path, fileMatch[2]))`.
3. Zostaw ochrone path traversal, ale uprosc:

```ts
const basePath = pathResolve(project.base_path);
const filePath = pathResolve(basePath, requestedFile);
const relativePath = relative(basePath, filePath);
if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) forbidden;
```

4. Przy 404 zwracaj diagnostyke:
   - `error`
   - `projectId`
   - `basePath`
   - `requestedFile`
   - `filePath`
5. Nie wysylaj sekretow.
6. Dodaj endpoint diagnostyczny lub rozszerz projekt:
   - `/api/projects/:id/files`
   - zwraca liste oczekiwanych plikow i status exists/missing.

Acceptance:

- `/api/projects/:id/file/PROJECT_PLAN.md` zwraca markdown.
- `/api/projects/:id/file/ARCHITECTURE.md` zwraca markdown z Mermaid.
- Path traversal przez `%2e%2e` dalej daje 403.

## Faza 5: Naprawa GraphsView

Plik:

- `packages/web/src/dashboard/pages/GraphsView.tsx`

Zmiany:

1. Regex na Mermaid:

```ts
const blocks = [...markdown.matchAll(/```mermaid\s*[\r\n]+([\s\S]*?)```/gi)];
```

2. Zamiast manipulowac `innerHTML` w petli bez stanu, trzymaj tablice diagramow w stanie:
   - `loading`
   - `error`
   - `diagrams: { id: string; code: string; svg?: string; error?: string }[]`
3. Renderuj kazdy diagram osobno.
4. Lap blad Mermaid per block:
   - jezeli jeden diagram zly, pokaz blad dla tego diagramu, ale renderuj pozostale.
5. Ustaw Mermaid init z bezpiecznym, ale praktycznym configiem:

```ts
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'strict',
});
```

6. Dla id Mermaid uzyj stabilnego prefiksu bez znakow specjalnych:

```ts
const mermaidId = `planora-graph-${safeProjectId}-${i}-${Date.now()}`;
```

7. Po nieudanym fetchu pokaz szczegoly z API:
   - "Nie znaleziono ARCHITECTURE.md"
   - "base_path: ..."
   - "sprawdz: planora plan ..."

Acceptance:

- Mermaid z `\n` i `\r\n` dziala.
- Jeden popsuty blok nie ukrywa wszystkich grafow.
- User widzi realna przyczyne: brak pliku vs blad parsowania diagramu.

## Faza 6: Naprawa MindMapView

Plik:

- `packages/web/src/dashboard/pages/MindMapView.tsx`

Zmiany:

1. Dodaj cleanup starej instancji Markmap.
2. Przed renderem wyczysc SVG.
3. Po renderze wywolaj `fit()` po `requestAnimationFrame`.
4. Dodaj `loading` i szczegolowy error.
5. Upewnij sie, ze `.mindmap-svg` ma realny height w CSS.

Acceptance:

- Przelaczanie projektow nie zostawia starej mapy.
- Mapa ma widoczny rozmiar.
- Brak `MINDMAP.md` pokazuje diagnostyke, nie pusty ekran.

## Faza 7: Naprawa podwojnego pytania o nazwe projektu

Pliki:

- `packages/cli/src/commands/init.ts`
- `packages/cli/src/commands/plan.ts`
- mozliwie `packages/cli/src/commands/helpers.ts`

Hipoteza:

Podwojne pytanie moze wynikac z flow usera `planora init`, a potem `planora plan`, gdzie `plan` nie wykrywa metadanych, bo:

- user jest w innym katalogu niz projekt,
- `plan` szuka tylko `cwd/.planora/planora.json`,
- statyczny `plan` zapisuje metadane w innym miejscu niz `init`,
- `description` nigdy nie jest odczytywany z `planora.json`, bo `detectedDescription` jest deklarowany, ale nie ustawiany.

Zmiany:

1. `planoraJsonGenerator` powinien zawierac `description` i `timeline`.
2. `init` ma zapisac description w `.planora/planora.json`.
3. `plan` ma odczytac:
   - `name`
   - `description`
   - `stack`
   - `timeline`
4. Jezeli `name` wykryte i `description/stack/timeline` wykryte, `plan` nie zadaje pytan.
5. Jezeli brakuje tylko opisu, pyta tylko o opis, nie pyta znowu o nazwe.
6. W logu pokazuje:

```text
Wykryto projekt: TestApp
Katalog projektu: C:\...\TestApp
Brakuje: opis, timeline
```

Acceptance:

- `planora init` pyta o nazwe raz.
- Potem wejscie do katalogu projektu i `planora plan` nie pyta o nazwe.
- `planora plan -n X -d Y -s Z -t T` nie otwiera promptow.

## Faza 8: Migracja / kompatybilnosc starych projektow

Pliki:

- `packages/cli/src/commands/plan.ts`
- `packages/cli/src/commands/web.ts`

Zrobic lekka kompatybilnosc:

1. Przy odczycie metadanych sprawdzaj kolejno:
   - `projectDir/.planora/planora.json`
   - `projectDir/planora.json` jako legacy
2. Jezeli legacy istnieje, a `.planora/planora.json` nie istnieje:
   - utworz `.planora`
   - skopiuj albo przepisz metadane do `.planora/planora.json`
   - nie usuwaj starego pliku automatycznie.
3. Web moze szukac plikow tylko w `base_path`; nie powinien zgadywac losowych folderow, ale endpoint diagnostyczny moze wskazac legacy metadata.

Acceptance:

- Stary projekt z `planora.json` nadal dziala po pierwszym `planora plan`.
- Nowe projekty uzywaja tylko `.planora/planora.json`.

## Faza 9: Testy automatyczne

Minimalne testy:

1. CLI static plan creates folder:
   - setup tmp dir
   - run built CLI albo test helper
   - assert:
     - `TestApp/.planora/planora.json`
     - `TestApp/PROJECT_PLAN.md`
     - `TestApp/ARCHITECTURE.md`
2. CLI plan inside existing project:
   - create `TestApp/.planora/planora.json`
   - run `planora plan` z brakujacymi parametrami tylko jezeli mozna podac stdin
   - assert no `TestApp/TestApp`
3. Web API file endpoint:
   - create SQLite tmp DB albo mock storage
   - base_path tmp project
   - fetch `/api/projects/:id/file/ARCHITECTURE.md`
   - assert 200
4. Path traversal:
   - fetch `/api/projects/:id/file/../secret.txt`
   - assert 403
5. Mermaid extraction unit:
   - markdown with CRLF
   - markdown with spaces after `mermaid`
   - assert blocks extracted

Manual smoke:

```powershell
npm.cmd run build
$name = 'planora-smoke-' + [guid]::NewGuid().ToString('N').Substring(0,8)
node packages\cli\dist\index.js plan --name $name --description 'Smoke app' --stack 'TypeScript, React, Node.js' --timeline '2 tygodnie'
node packages\cli\dist\index.js web --port 4199
```

Then open:

```text
http://127.0.0.1:4199/
```

Check:

- dashboard lists project
- project overview shows `PROJECT_PLAN.md`
- Mind Map renders
- Graphs renders at least one Mermaid diagram

## Faza 10: Kolejnosc pracy dla agenta

Agent powinien pracowac tak:

1. Przeczytaj:
   - `packages/cli/src/commands/init.ts`
   - `packages/cli/src/commands/plan.ts`
   - `packages/cli/src/commands/web.ts`
   - `packages/runner/src/agent.ts`
   - `packages/runner/src/tools/index.ts`
   - `packages/web/src/dashboard/pages/ProjectView.tsx`
   - `packages/web/src/dashboard/pages/MindMapView.tsx`
   - `packages/web/src/dashboard/pages/GraphsView.tsx`
   - `packages/core/src/generators/planora-json.ts`
   - `packages/core/src/storage/sqlite.ts`
2. Najpierw napraw kontrakt katalogow w CLI.
3. Potem napraw AI planner zapisujacy w zlym miejscu.
4. Potem napraw web API diagnostyke i path handling.
5. Potem napraw frontend Graphs/MindMap.
6. Na koncu testy i smoke.

## Zakres zmian oczekiwany

Do modyfikacji prawdopodobnie:

- `packages/cli/src/commands/plan.ts`
- `packages/cli/src/commands/init.ts`
- `packages/cli/src/commands/web.ts`
- `packages/cli/src/commands/helpers.ts`
- `packages/runner/src/agent.ts`
- `packages/runner/src/tools/index.ts`
- `packages/runner/src/prompts/planner.ts`
- `packages/web/src/dashboard/pages/GraphsView.tsx`
- `packages/web/src/dashboard/pages/MindMapView.tsx`
- `packages/web/src/dashboard/pages/ProjectView.tsx`
- `packages/core/src/generators/planora-json.ts`
- test files under `packages/core/tests`, `packages/runner/tests`, or new CLI tests if existing setup supports them

Nie ruszac:

- design landing page, jezeli nie trzeba
- publikacji npm
- Vercel config
- smoke folders poza repo root

## Definicja "done"

Zmiana jest gotowa dopiero gdy:

1. `npm.cmd run build` przechodzi.
2. `planora plan` tworzy osobny folder projektu.
3. `planora plan --ai` nie zapisuje plikow luzem w cwd.
4. `planora web` pokazuje projekt i czyta pliki po localhost.
5. Graphs renderuje Mermaid.
6. Mind Map renderuje Markmap.
7. CLI nie pyta dwa razy o nazwe przy normalnym flow `init -> cd project -> plan`.
8. Stare projekty z legacy `planora.json` nie sa popsute.

