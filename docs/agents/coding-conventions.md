# Coding conventions для агентов

## Общие принципы

1. **Минимальный diff** — меняй только то, что нужно для задачи
2. **Не ломай существующее** — проверяй lint/build если меняешь конфиг
3. **Не удаляй файлы** без явного запроса
4. **Не коммить** без явного запроса
5. **Не добавляй** зависимости без необходимости
6. **Следуй FSD** — см. [architecture-fsd.md](./architecture-fsd.md)
7. **Backend не трогаем** — только frontend + API client

## Naming

**Все имена файлов и папок — `kebab-case`, без исключений** (включая файлы React-компонентов).

| Что | Convention | Пример |
|-----|------------|--------|
| Файлы и папки | kebab-case | `text-input.tsx`, `content-grid.tsx`, `get-js-clamp.ts` |
| FSD slices | kebab-case | `assign-doctor`, `medical-verdict` |
| Component exports | PascalCase | `export function TextInput` |
| Hook files | `use-{verb}-{entity}.ts` | `use-get-patient-list.ts` |
| Hook exports | camelCase | `useGetPatientList` |
| Query keys | `QUERY_KEY` enum + factories в `query-key.ts` | `patientListQueryKey()` |
| Types | PascalCase, из Zod через `z.infer` | `Patient`, `AddPatientValues` |
| Form field keys | string enum `*_FIELDS` | `ADD_PATIENT_FIELDS` |
| Zod schemas | `*Schema` | `patientSchema`, `addPatientSchema` |
| Constants | UPPER_SNAKE or camelCase | `STATUS_COLORS` |

Имя файла — kebab, экспорт — по типу сущности (`text-input.tsx` → `export function TextInput`).

## File naming

```
text-input.tsx             # UI component (export TextInput)
text-input.module.scss     # стили компонента
use-get-patient-list.ts    # API hook (один файл = один хук)
types/index.ts             # Zod-схемы + типы сущности (см. types-and-zod.md)
index.ts                   # public API слайса (обязателен)
```

## Imports order

```ts
// 1. External
import { useQuery } from "@tanstack/react-query";

// 2. Shared (импорт из сегмента, через barrel)
import { apiPrivate, apiRoute } from "@shared/api";
import { Button, TextInput } from "@shared/ui";

// 3. Entities (импорт из слайса, через barrel)
import { useGetPatientList } from "@entities/patients";

// 4. Local (same slice/segment) — относительный путь, НЕ barrel
import { PatientCard } from "./patient-card";
```

Подробнее про алиасы и циклические импорты — [architecture-fsd.md](./architecture-fsd.md#импорты-и-path-aliases).

## Стили

- SCSS: `@use "@functions" as *;` — см. [styling.md](./styling.md)
- Clamp-first: размеры через `adapt()` / `getJsClamp()`, media queries только для layout
- Вертикальная вёрстка: `Stack` из `@shared/ui`

## Components

```tsx
"use client";

import { useGetPatientList } from "@entities/patients";

export function PatientList() {
  const { data, isLoading, isError, refetch } = useGetPatientList();

  if (isLoading) return <LoadingOverlay />;
  if (isError) return <ErrorState onRetry={refetch} />;
  if (!data?.length) return <EmptyState title="Нет пациентов" />;

  return data.map((patient) => <PatientCard key={patient.id} patient={patient} />);
}
```

## Types

См. [types-and-zod.md](./types-and-zod.md):

- Zod-схема — source of truth, типы через `z.infer`
- Все типы сущности — `5_entities/{entity}/types/index.ts`
- Формы: `*_FIELDS` enum + `*Values`; запросы: `*Payload` (отдельно, даже если равен Values)
- Ответы API: `*Response` на endpoint
- Не дублировать types между slices — entity owns its type

## Error & loading states

Каждый экран с query data обязан обрабатывать:

- `isLoading` → skeleton / overlay
- `isError` → ErrorState + retry
- empty data → EmptyState

## Env & config

```env
NEXT_PUBLIC_API_URL=https://api.example.com
```

Не хардкодить URL. Не коммитить `.env` с секретами.

## API-слой

См. [api-layer.md](./api-layer.md):

- `api` / `apiPrivate` — единственный способ HTTP
- `apiRoute(entity, route)` — единственный способ URL
- `query-key.ts` — единственное место для query keys

## Git

- Коммиты — только по запросу
- Push — только по запросу
- Conventional commits не обязательны, но сообщение должно описывать **why**

## Testing (future)

На MVP тесты не обязательны. Когда появятся:

- Unit: vitest
- Component: testing-library
- E2E: playwright

Не добавлять test infra без запроса.

## Checklist перед PR / завершением задачи

- [ ] Код в правильном FSD-слое
- [ ] Public API через `index.ts` у каждого слайса/сегмента
- [ ] Импорты через `@pages/*`, `@widgets/*`, `@features/*`, `@entities/*`, `@shared/*`
- [ ] Query/mutation hooks, не raw fetch
- [ ] `api` / `apiPrivate` + `apiRoute()` + keys из `query-key.ts`
- [ ] Mutation: invalidate всех связанных query keys; простые изменения — optimistic update ([tanstack-query.md](./tanstack-query.md))
- [ ] Loading/error/empty states
- [ ] Ошибки API — глобально через `queryClient`; success toast только для значимых mutations ([notifications.md](./notifications.md))
- [ ] `"use client"` только где нужно
- [ ] Нет unrelated changes
- [ ] `pnpm lint` проходит
