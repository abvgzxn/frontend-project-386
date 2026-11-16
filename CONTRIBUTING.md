# Вклад в проект

## Установка

Установите mise `2026.11.8`, затем выполните `mise install --locked` и `mise run install`.
Все зависимости устанавливаются из корневого `package-lock.json` через npm workspaces.

## Запуск

`mise run dev` запускает Vite и API через daemons mise. Конфигурация требует `experimental = true` и использует pitchfork `2.30.0`; API доступен на `127.0.0.1:3000`, Vite на `127.0.0.1:5173`. Для раздельного запуска используйте `npm run dev --workspace @call-calendar/api` и `npm run dev --workspace @call-calendar/web`.

## Проверки

- `mise run generate` обновляет OpenAPI и SDK из TypeSpec.
- `mise run lint` проверяет Oxlint и форматирование Oxfmt без исправлений.
- `mise run typecheck` проверяет TypeScript.
- `mise run test` запускает Vitest один раз.
- `mise run check` выполняет генерацию, lint, typecheck, тесты и сборку; зависимости должны быть установлены заранее через `mise run install`.

Проверки не изменяют файлы автоматически. Git-хуки hk вызывают `mise run check` перед commit и push.

## Правила

- Сгенерированные файлы в `contracts/generated` и `packages/api-client/src/generated` не редактируются вручную.
- Сообщения коммитов следуют Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:` и другим стандартным префиксам.
