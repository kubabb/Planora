# Plan naprawy po commicie 27cf796

## Cel

Przywrocic jasny podzial na dwa rozne produkty:

1. Publiczna strona produktu Planora, deployowana na Vercel.
2. Lokalny dashboard uzytkownika, uruchamiany dopiero po wygenerowaniu projektu przez CLI, np. `planora plan` / `planora init`, a potem `planora web`.

Dashboard nie powinien zastapic landing page'a pod `/` w aplikacji web deployowanej na Vercel. Lokalnie po instalacji z npm dashboard ma pokazywac projekty zapisane w `~/.planora/planora.db` i pliki wygenerowane w katalogu projektu.

## Co jest teraz popsute

### 1. Strona produktu zostala zastapiona dashboardem

Commit `27cf796` usunal prawie cala dotychczasowa zawartosc `packages/web/src/App.tsx` i podmienil route `/` na `Dashboard`.

Efekt:

- `localhost:4173` pokazuje surowy dashboard, jak na screenie.
- Publiczny web i lokalny user dashboard sa zmieszane w jednej aplikacji bez trybu uruchomienia.
- Nawigacja produktu (`Home`, `Documentation`, `About us`, `Blog`) zostala zastapiona linkami dashboardu (`Dashboard`, `Settings`, `Documentation`).
- Import `docs-sections.ts` istnieje, ale dokumentacja nie jest podlaczona do routingu, wiec link `/documentation` nie ma dzialajacego widoku.

### 2. Build nie przechodzi

`npm.cmd run build` konczy sie bledem:

```text
packages/web/src/pages/MindMapView.tsx(19,52): error TS2345:
Argument of type 'null' is not assignable to parameter of type 'Partial<IMarkmapOptions> | undefined'.
```

To znaczy, ze obecny commit nie jest gotowy do publikacji ani do npm.

### 3. Dashboard wymaga API, ktorego Vite dev server nie wystawia

Nowe strony dashboardu robia requesty:

- `/api/projects`
- `/api/projects/:id`
- `/api/projects/:id/file/...`
- `/api/settings`

Ale `packages/web/src/main.tsx` uruchamiane przez Vite nie startuje `packages/web/server.ts`. Dlatego `npm run dev --workspace @planora/web` albo poprzednie `planora web --dev` beda renderowac frontend bez danych albo z pustym stanem.

### 4. Nowy `server.ts` nie jest faktycznie uzywany przez CLI

Dodano `packages/web/server.ts`, ale `packages/cli/src/commands/web.ts` ma wlasny prosty static server i nie obsluguje `/api/*`.

Efekt:

- produkcyjne `planora web` serwuje tylko pliki z `dist`;
- dashboard fetchuje `/api/projects`, ale CLI server zwroci mu `index.html` jako fallback SPA;
- frontend sprobuje zrobic `res.json()` z HTML i skonczy w pustym stanie.

### 5. Sciezki do web package w CLI sa podejrzane

W `packages/cli/src/commands/web.ts` jest:

```ts
const webPackageDir = join(import.meta.dirname, '..', '..', 'web');
```

Po zbudowaniu CLI z `packages/cli/src` do `packages/cli/dist` ta sciezka wskazuje raczej na `packages/cli/web`, nie na `packages/web`. W npm package CLI dodatkowo `files` zawiera tylko `dist`, wiec nie ma gwarancji, ze dashboardowe assety z `@planora/web` beda w ogole dostepne po instalacji.

### 6. Kod ma popsute kodowanie znakow

W wielu plikach widac mojibake, np.:

- tekst strzalki "Back to Dashboard" renderuje sie jako popsuty ciag znakow;
- komentarze typu "planora init - initialize" maja zepsuty separator;
- symbole sukcesu, bledu i emoji w CLI sa zapisane jako nieczytelne bajty.

To juz bylo widoczne w czesci CLI, ale nowy commit dopisal kolejne popsute znaki w nowych stronach. Trzeba to uporzadkowac przed publikacja, najlepiej przez ASCII w kodzie CLI/UI albo poprawne UTF-8 w calym repo.

### 7. API czyta pliki z projektu bez bezpiecznego ograniczenia sciezki

Endpoint:

```ts
const filePath = join(project.base_path, fileMatch[2]);
```

pozwala potencjalnie odczytac pliki spoza projektu przez segmenty typu `../`, jezeli URL zostanie odpowiednio spreparowany. Nawet lokalny dashboard powinien pilnowac, ze finalna sciezka zostaje w `base_path`.

### 8. Zaleznosci zostaly dodane szeroko i niekonsekwentnie

Commit zmienil zaleznosci w kilku package'ach i bardzo rozdmuchal root `package-lock.json`.

Do sprawdzenia:

- czy `better-sqlite3` powinien byc zaleznoscia root, `@planora/core`, `@planora/cli`, czy dashboard servera;
- czy `react-router-dom`, `react-markdown`, `mermaid`, `markmap-*` sa potrzebne w publicznym webie, czy tylko w dashboardzie;
- czy `@planora/web` ma byc publikowany jako osobny package, czy bundle ma byc kopiowany do CLI package.

## Docelowa architektura

### Publiczny web na Vercel

`packages/web` powinien domyslnie budowac strone produktu:

- `/` landing page Planora;
- `/documentation` publiczna dokumentacja produktu;
- `/about` albo sekcja About;
- `/blog` albo placeholder, jesli jeszcze nie ma bloga;
- bez lokalnych requestow do `/api/projects`;
- bez zaleznosci od `~/.planora`.

Ta aplikacja jest statyczna i bezpieczna do deploya na Vercel.

### Lokalny dashboard po planowaniu

Dashboard powinien byc osobnym trybem albo osobnym entrypointem:

- `planora web` uruchamia lokalny server z API i assetami dashboardu;
- dashboard pokazuje projekty z `~/.planora/planora.db`;
- dashboard ma pusty stan tylko wtedy, gdy uzytkownik nie uruchomil jeszcze `planora init` ani `planora plan`;
- po `planora plan` projekt musi byc zapisany do SQLite tak samo jak po `planora init`;
- server musi obslugiwac `/api/*` oraz fallback SPA;
- deep linki `/project/:id`, `/project/:id/mindmap`, `/project/:id/graphs` maja dzialac po odswiezeniu.

Najczystsze warianty:

1. `packages/web` zostaje strona produktu, a dashboard idzie do `packages/dashboard`.
2. Jeden package `packages/web`, ale dwa entrypointy: `src/product/App.tsx` i `src/dashboard/App.tsx`, dwa buildy Vite i dwa outputy, np. `dist/product` oraz `dist/dashboard`.

Rekomendacja: wariant 2 na teraz, bo mniej rusza strukture monorepo. Docelowo mozna wydzielic `packages/dashboard`, jesli projekt urosnie.

## Plan naprawy

### Krok 1. Zabezpieczyc stan i odtworzyc product page

- Przywrocic poprzedni `App.tsx` strony produktu z commita przed `27cf796`.
- Nie wyrzucac nowego dashboardu, tylko przeniesc go do osobnego entrypointu.
- Podlaczyc `docs-sections.ts` do prawdziwej publicznej strony `/documentation` albo usunac martwy import, jesli wracamy do starej dokumentacji w `App.tsx`.
- Sprawdzic, czy Vercel build pokazuje landing page, nie dashboard.

### Krok 2. Wydzielic dashboard runtime

- Utworzyc np.:
  - `packages/web/src/product/App.tsx`
  - `packages/web/src/product/main.tsx`
  - `packages/web/src/dashboard/App.tsx`
  - `packages/web/src/dashboard/main.tsx`
  - `packages/web/src/dashboard/pages/*`
- Dodac osobne konfiguracje Vite albo osobne HTML entry:
  - `index.html` dla produktu;
  - `dashboard.html` albo osobny `vite.dashboard.config.ts` dla lokalnego dashboardu.
- Dashboardowe style oddzielic od stylow landing page'a, zeby prosty dashboard nie kasowal dopracowanego wygladu produktu.

### Krok 3. Naprawic `planora web`

- `planora web` ma startowac lokalny Node server, ktory:
  - serwuje dashboardowy build;
  - obsluguje `/api/projects`, `/api/settings`, pliki projektu;
  - otwiera URL albo przynajmniej wypisuje `http://localhost:4173`;
  - przy braku `dist/dashboard` daje jasny komunikat dla dev builda.
- Usunac duplikacje: API nie moze mieszkac w martwym `packages/web/server.ts`, jesli CLI ma wlasny server. Albo CLI importuje wspolny server z `@planora/web/server`, albo server trafia do CLI jako kod runtime.
- Poprawic sciezki assetow po buildzie i po instalacji z npm. Trzeba zdecydowac:
  - CLI zalezy od `@planora/web` i znajduje jego `dist/dashboard`;
  - albo release process kopiuje dashboard build do `packages/cli/dist/web`.

### Krok 4. Sprawic, zeby dashboard pojawial sie po `planora plan`

- Teraz `generateStatic` zapisuje projekt do SQLite tylko gdy tworzy nowy katalog, ale `generateWithAi` nie zapisuje projektu do SQLite.
- Po udanym `planora plan --ai` trzeba:
  - zapisac projekt w `SqliteStorage`;
  - zapisac `basePath` katalogu, gdzie sa wygenerowane pliki;
  - upewnic sie, ze `PROJECT_PLAN.md`, `ROADMAP.md`, `MINDMAP.md`, `ARCHITECTURE.md` sa w tym samym katalogu, ktory dashboard odczytuje.
- Po `planora plan` CLI powinno wypisac nastepny krok:

```text
Open dashboard: planora web
```

### Krok 5. Naprawic dashboard API

- `/api/projects` powinno zwracac pusta tablice, jesli baza jeszcze nie istnieje, zamiast 500.
- `/api/settings` powinno dzialac, gdy config nie istnieje, i nie powinno wykladac calej strony.
- Odczyt plikow musi uzywac `resolve()` i sprawdzac, czy finalna sciezka zaczyna sie od `basePath`.
- Zwracac poprawne statusy i JSON dla bledow, zeby frontend nie probowal parsowac HTML jako JSON.
- Dodac endpoint manifestu projektu, np. lista dostepnych wygenerowanych plikow.

### Krok 6. Naprawic frontend dashboardu

- Poprawic blad TypeScript w `MindMapView`: zamiast `null` przekazac `undefined` albo poprawny obiekt opcji.
- Dodac stany error/loading dla kazdego fetch.
- Nie zakladac, ze markdown/mermaid/mindmap istnieja.
- Naprawic mojibake w tekstach linkow.
- Mermaid render powinien miec unikalne ID per projekt/render, zeby uniknac kolizji przy ponownym wejsciu na strone.
- Dashboard powinien byc wygladem rozsadny, ale nie powinien udawac strony produktu.

### Krok 7. Uporzadkowac pakowanie npm

- Sprawdzic `npm pack --workspace @planora/cli`, czy paczka zawiera wszystko potrzebne do `planora web`.
- Jesli `@planora/web` ma byc osobno publikowany, dodac go jako runtime dependency CLI i upewnic sie, ze `files` publikuje build dashboardu.
- Jesli nie, skopiowac dashboard static assets do CLI podczas builda.
- Nie publikowac publicznego landing page'a jako runtime dashboardu, chyba ze jest potrzebny w CLI.

### Krok 8. Testy i QA

Minimalny zestaw przed kolejnym push:

- `npm.cmd run build`
- `npm.cmd test`
- `npm.cmd run build --workspace @planora/web`
- `npm.cmd pack --workspace @planora/cli`
- test manualny:
  - `planora plan -n test-dashboard`
  - `planora web --port 4173`
  - wejscie na `/`, `/project/:id`, `/project/:id/mindmap`, `/project/:id/graphs`, `/settings`
- test publicznego weba:
  - lokalny preview strony produktu;
  - `/` pokazuje landing page;
  - `/documentation` pokazuje dokumentacje;
  - brak requestow do `/api/projects` na stronie Vercel.

## Proponowana kolejnosc commitow

1. `fix(web): restore product site and split dashboard entry`
2. `fix(cli): serve local dashboard with api`
3. `fix(cli): persist planned projects for dashboard`
4. `fix(web): harden dashboard rendering and file access`
5. `chore(release): verify npm package contents`

## Decyzja produktowa

Zgodnie z zalozeniem: publiczna Vercel strona to strona produktu. Lokalny dashboard to narzedzie uzytkownika, do ktorego wchodzi sie po utworzeniu lub zaplanowaniu projektu lokalnie. Nie mieszamy tych dwoch wejsc pod tym samym `/` w tym samym deployu.
