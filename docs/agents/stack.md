# Стек

## Текущий фундамент (уже в проекте)

- **Next.js 16** — App Router
- **React 19**
- **TypeScript 5.9**
- **OpenNext Cloudflare** — деплой на Cloudflare Workers
- **ESLint** — `eslint-config-next`

## Добавляемые зависимости

### Server state

```bash
pnpm add @tanstack/react-query
pnpm add -D @tanstack/react-query-devtools
```

### Styling (SCSS)

```bash
pnpm add -D sass
```

В `.module.scss`: `@use "@functions" as *;` — fluid-размеры через `adapt()`. Подробнее: [styling.md](./styling.md).

### UI

```bash
pnpm add @mantine/core @mantine/hooks @mantine/form @mantine/dates @mantine/notifications @mantine/modals
pnpm add dayjs
```

Mantine требует CSS-импорты в root layout / providers — см. [ui-mantine.md](./ui-mantine.md).

### HTTP + validation

```bash
pnpm add axios zod
```

### Client UI state

```bash
pnpm add zustand
```

Использовать **только** для локального UI-state (sidebar open, wizard step, modal state). Backend-данные — только TanStack Query.

## Что НЕ добавлять на старте

| Библиотека | Почему |
|------------|--------|
| Tailwind / UnoCSS и пр. utility-CSS | Удалён: конфликтует с `@shared/ui`-обёртками. Стили — SCSS Modules + `@functions` ([styling.md](./styling.md)) |
| Redux / MobX | TanStack Query + Zustand достаточно |
| GraphQL / Apollo | Backend — REST (пока) |
| react-hook-form | Mantine Form + Zod хватит для MVP |
| Full calendar lib | Сначала slots/list views; calendar — по необходимости |
| Generated OpenAPI client | Добавить, когда backend отдаст стабильный OpenAPI spec |

## Опционально (позже)

- `@tanstack/react-table` — если reception/doctor таблицы потребуют сложную сортировку/фильтрацию
- OpenAPI codegen (`openapi-typescript`, `orval`) — когда API стабилизируется

## HTTP client (axios)

Два singleton-инстанса в `src/6_shared/api/api.ts`: `api` (публичный) и `apiPrivate` (с токеном).

Подробнее: [api-layer.md](./api-layer.md).

```ts
import { apiPrivate, apiRoute } from "@shared/api";

apiPrivate
  .get<Patient[]>(apiRoute("PATIENT", "GET_LIST"))
  .then((r) => r.data);
```

## Backend integration

- Backend — **отдельный сервис**, другая команда, другой хост
- Фронт не содержит business logic backend'а
- Auth: Bearer token через `apiPrivate` interceptors
- Все запросы через `api` / `apiPrivate` из `6_shared/api/api.ts`

## Env variables

| Variable | Описание |
|----------|----------|
| `NEXT_PUBLIC_API_URL` | Base URL внешнего API |

## Scripts

```bash
pnpm dev       # локальная разработка
pnpm build     # production build
pnpm lint      # eslint
pnpm deploy    # OpenNext → Cloudflare
```
