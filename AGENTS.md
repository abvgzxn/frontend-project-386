# Agent Instructions

## Repository Shape

- This is an npm-workspaces monorepo with one root `package-lock.json`: `apps/api` is the Fastify API, `apps/web` is the React/Vite/Mantine frontend, `packages/api-client` is the generated Fetch SDK wrapper, and `contracts` owns the TypeSpec source.
- The current implementation is intentionally only `GET /api/health` plus the frontend API-status page. Treat the owner/guest scenarios in `README.md` as requirements for later work, not as implemented behavior.

## Code Generation

- API changes start in `contracts/main.tsp`; run `mise run generate` to produce `contracts/generated/openapi.yaml`, then the SDK under `packages/api-client/src/generated`.
- Never hand-edit `contracts/generated` or `packages/api-client/src/generated`; adjust TypeSpec or `openapi-ts.config.ts` and regenerate.
- `generate` is a prerequisite of lint, typecheck, test, and build through `mise.toml`; do not bypass it when verifying SDK consumers.

## Commands

- Install reproducibly with `mise install --locked` followed by `mise run install` (`npm ci`).
- The repository uses mise `2026.11.8`; daemon support requires `experimental = true` and the pinned pitchfork `2.30.0`.
- Run the development environment with `mise run dev`; mise daemons expose API on `127.0.0.1:3000` and Vite on `127.0.0.1:5173`, with `/api` proxied to the API.
- Run focused checks with `npm run test --workspace @call-calendar/api`, `npm run typecheck --workspace @call-calendar/api`, or `npm run typecheck --workspace @call-calendar/web`.
- Run the complete local gate with `mise run check`; its order is generate, lint, typecheck, Vitest, then both builds.
- `mise run lint` and `hk` checks are read-only; they must not auto-fix files.
- `mise run generate` and `mise run check` assume dependencies are already installed; CI runs `mise run install` explicitly first.

## Testing And Workflow

- The API smoke test in `apps/api/src/health.test.ts` uses a real HTTP request on a dynamically allocated port and closes every server in `afterEach`; preserve that isolation pattern.
- `hk` runs `mise run check` for `pre-commit`, `pre-push`, and `hk check`; CI runs the same `mise run check` on push and pull requests.
- Use Conventional Commits, for example `feat:`, `fix:`, `chore:`, or `docs:`.
- Каждый коммит реализации содержит номер соответствующего тикета, например `feat: add meeting type catalog (#16)`.

## Agent skills

### Issue tracker

Issues and specs live in GitHub Issues; use the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the five standard labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Use the project glossary and ADRs described in `docs/agents/domain.md`.

### Workflows

Use `/wayfinder` for large planning efforts and `/implement-spec` to implement a spec; see `.agents/skills/`.
