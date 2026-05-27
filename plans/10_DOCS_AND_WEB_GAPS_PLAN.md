# Planora - Documentation and Web App Gap Plan

## Current Situation

The public web documentation is currently a short hand-written page inside `packages/web/src/App.tsx`. It explains the product direction, generated files, architecture, agent direction, and implementation order, but it does not yet give users enough information to install, configure, and use Planora confidently.

The web app is also still closer to a landing page with documentation than to the local dashboard described in `plans/06_WEB_APP.md`.

## Missing Documentation

- Installation instructions.
- Runtime requirements.
- Local development setup.
- Global npm installation status.
- AI provider configuration.
- First-run workflow.
- Full CLI command reference.
- Generated file reference.
- Local storage and privacy notes.
- Troubleshooting.
- Security notes.
- Clear product status: what works now, what is still planned.

## Missing Web App Features

- Real dashboard route.
- Project list from local storage.
- Project detail view.
- Markdown rendering for generated plan files.
- Mind map rendering for `MINDMAP.md`.
- Mermaid rendering for `ARCHITECTURE.md`.
- Agent run history view.
- Settings view for provider/model status.
- Local API or static runtime strategy for `planora web`.
- Production-ready packaging for global npm install.

## Key Findings

- Documentation sections are hard-coded in `packages/web/src/App.tsx`.
- The current documentation does not include installation.
- `packages/web/package.json` only includes `react` and `react-dom` as runtime dependencies, so planned docs/project rendering libraries are not installed yet.
- `planora web` currently runs `npx vite`, which is developer-oriented and not a clean global-user runtime.
- `@planora/cli` is still marked `private: true`, so public `npm install -g planora` is not ready yet.
- The web app spec in `plans/06_WEB_APP.md` describes routes and views that are not yet implemented.

## Phase 1 - Fix Web Documentation

1. Add a proper `Installation` section.
2. Add `Requirements`.
3. Add `Quick Start`.
4. Add `Configure AI`.
5. Add `Create a Project`.
6. Add `Generate Planning Files`.
7. Add `Open the Dashboard`.
8. Add `CLI Commands`.
9. Add `Generated Files`.
10. Add `Local Storage and Privacy`.
11. Add `Troubleshooting`.
12. Add `Current Status`.
13. Fix broken text encoding in existing docs content.

Recommended structure:

```text
Overview
Installation
Requirements
Quick Start
Configuration
Commands
Generated Files
Dashboard
Agent
Storage and Privacy
Troubleshooting
Roadmap
```

## Phase 2 - Make Installation Honest

Until npm publishing is ready, documentation should show two flows:

### Local Development

```bash
npm install
npm run build
```

Optional local CLI test:

```bash
npm link --workspace @planora/cli
planora --help
```

### Future Global Install

```bash
npm install -g planora
planora config
planora init --name "my-app" --stack "react,node,postgres"
planora plan --ai
planora web
```

The docs should label this as the intended release flow until the package is actually published.

## Phase 3 - Prepare npm Packaging

1. Decide final npm package name: `planora` or `@planora/cli`.
2. Remove `private: true` only when publishing is ready.
3. Verify `bin.planora` points to a built file with a working shebang.
4. Add `.npmignore` files or confirm `files` arrays are enough.
5. Ensure `dist/` is included in published packages.
6. Run `npm pack`.
7. Install the tarball globally in a clean environment.
8. Test:
   - `planora --help`
   - `planora config --show`
   - `planora init`
   - `planora plan`
   - `planora web`

## Phase 4 - Fix `planora web`

The current `planora web` command starts Vite through `npx`, which is useful for development but not ideal after global installation.

Target behavior:

1. Build the web app during package preparation.
2. Include the built web assets in the package.
3. Make `planora web` serve static built assets from `dist`.
4. Add a small local server for the dashboard.
5. Add an optional `--dev` mode for running Vite during repository development.
6. Keep `--port` support.
7. Show clear errors when assets are missing.

## Phase 5 - Build the Real Dashboard

Implement the dashboard described in `plans/06_WEB_APP.md`.

Routes:

```text
/                      Dashboard
/project/:id           Project overview
/project/:id/mindmap   Mind map view
/project/:id/graphs    Mermaid graph view
/settings              Settings
/documentation         Product documentation
```

Dashboard features:

- Project list.
- Search.
- Empty state with `planora init` guidance.
- Last updated time.
- Stack summary.
- Last agent run status.
- Open project action.

## Phase 6 - Project Views

Project overview should read generated files from the project directory:

- `PROJECT_PLAN.md`
- `ROADMAP.md`
- `MINDMAP.md`
- `ARCHITECTURE.md`
- `AGENT_SETUP.md`
- `planora.json`

Views:

- Overview: render `PROJECT_PLAN.md`.
- Roadmap: render `ROADMAP.md`.
- Mind Map: render `MINDMAP.md` using markmap.
- Graphs: extract and render Mermaid blocks from `ARCHITECTURE.md`.
- Agent Runs: show SQLite run history.

## Phase 7 - Add Rendering Dependencies

Add web dependencies when the dashboard work starts:

```bash
npm install react-router-dom react-markdown mermaid markmap-lib markmap-view
```

Potential supporting dependencies:

```bash
npm install rehype-sanitize remark-gfm
```

Keep Markdown rendering sanitized because generated content may include arbitrary text from AI output.

## Phase 8 - Settings and Agent Status

Settings should show:

- Active provider.
- Active model.
- Config file path.
- Whether AI config exists.
- Whether local database exists.
- Qdrant memory status if configured.

Never display raw API keys.

Agent status should show:

- Recent runs.
- Workflow type.
- Status.
- Steps used.
- Tokens used.
- Error summary.
- Output preview.

## Phase 9 - Testing and Quality

Add focused tests:

- CLI integration tests for `init`, `plan`, and `web`.
- Web build test.
- Dashboard empty state test.
- Documentation route smoke test.
- Markdown renderer test.
- Mermaid block extraction test.
- Encoding check for broken characters such as `â`.

Manual QA checklist:

- `/documentation` opens at the top.
- Only one documentation sidebar appears.
- Installation section is visible.
- Mobile docs navigation remains accessible.
- `planora web` works after package build.
- No API keys appear in logs or UI.

## Suggested Implementation Order

1. Expand documentation page.
2. Fix encoding issues.
3. Update README to match documentation.
4. Fix `planora web` runtime strategy.
5. Prepare npm packaging.
6. Add dashboard routing and layout.
7. Add project list.
8. Add project detail markdown views.
9. Add mind map and Mermaid renderers.
10. Add settings and agent history.
11. Add tests.
12. Run `npm pack` and global install verification.

## Definition of Done

- A new user can understand how to install and run Planora.
- Documentation clearly separates current local-dev flow from future global install flow.
- The web documentation is not misleading.
- `planora web` no longer depends on a repository-local Vite dev setup for normal use.
- The dashboard reflects real local projects.
- Generated Markdown files can be viewed inside the web app.
- Mind maps and Mermaid diagrams render from generated files.
- No secrets are displayed in the UI or logs.
