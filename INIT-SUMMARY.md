# Сводка для /init

- `apps/web` — React/Vite/Mantine-страница и proxy `/api` на API.
- `apps/api` — Fastify-приложение с `GET /api/health` и настоящим HTTP smoke-тестом.
- `packages/api-client` — генерируемый Hey API Fetch SDK.
- `contracts` — исходник TypeSpec и генерируемый OpenAPI.
- `mise.toml` — зафиксированные Node, mise, hk, pitchfork и задачи.
- `hk.pkl` — pre-commit/pre-push вызывают `mise run check` без автоисправлений.

Основные команды: `mise run install`, `mise run generate`, `mise run dev`,
`mise run build`, `mise run lint`, `mise run typecheck`, `mise run test`,
`mise run check`.

Правила: сначала читать README и сохранять пользовательские сценарии; генерация
контрактов обязательна перед проверками и сборкой; generated-файлы не редактировать;
коммиты оформлять по Conventional Commits (`feat:`, `fix:`, `chore:` и т. д.).
