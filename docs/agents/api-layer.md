# API-слой (axios + TanStack Query)

Концептуальное описание HTTP-слоя. Детали TanStack Query — в [tanstack-query.md](./tanstack-query.md).

## Поток данных

```
UI (pages / widgets / features)
  → хук в 5_entities/{entity}/use-{verb}-{entity}.ts
    → api или apiPrivate
    → apiRoute(entity, route) из api-routes.ts
    → query key factory из query-key.ts
```

## HTTP-клиент

Два singleton-инстанса axios в `src/6_shared/api/api.ts`:

| Инстанс | Когда использовать |
|---------|-------------------|
| `api` | Публичные запросы без авторизации (логин, регистрация, справочники) |
| `apiPrivate` | Запросы с Bearer-токеном |

**Правила:**

- Не импортировать `axios` напрямую вне `src/6_shared/api/`
- Не вызывать `axios.create()` вне `api.ts`
- Каждый сетевой запрос — через `api` или `apiPrivate`

`apiPrivate` добавляет токен в заголовки, обрабатывает истечение сессии и 401.

Хуки и внешний код импортируют API-клиент, routes и query keys из `@shared/api` (barrel `6_shared/api/index.ts`).

## Маршруты API

Все URL — в `src/6_shared/api/api-routes.ts`, сгруппированы по сущностям:

```ts
API_ROUTES.PATIENT.GET_LIST  // "/patient/list"
```

В хуках URL собирается **только** через `apiRoute("PATIENT", "GET_LIST")`.

Хардкод строковых путей в `api.get("/...")` запрещён.

## Query keys

Все ключи TanStack Query — в `src/6_shared/api/query-key.ts`:

- `enum QUERY_KEY` — scope (первый элемент ключа)
- factory-функции (`patientListQueryKey`, …) — полный ключ

Хуки импортируют factory, не собирают `queryKey: [...]` inline.

Первый элемент любого ключа — значение из `QUERY_KEY`.

## Хуки запросов

Каждый API-запрос — отдельный хук в `5_entities/{entity}/`:

| Часть | Формат | Пример |
|-------|--------|--------|
| Папка | kebab-case | `5_entities/patients/` |
| Файл | `use-{verb}-{entity}.ts` | `use-get-patient-list.ts` |
| Экспорт | camelCase | `useGetPatientList` |

Глаголы: `get`, `create`, `add`, `delete`, `cancel`, `change`, `select` и т.п.

Queries и mutations для сущности живут в её entity-слайсе.

Типы сущности — в `5_entities/{entity}/types/index.ts`. См. [types-and-zod.md](./types-and-zod.md).

## Env

```env
NEXT_PUBLIC_API_URL=https://api.example.com
```

Используется в `api-routes.ts` как `BASE_API_URL`.

## ESLint

Линтер проверяет:

- импорт `axios` только в `6_shared/api/`
- отсутствие inline URL в HTTP-вызовах
- отсутствие inline `queryKey` в хуках
- `QUERY_KEY` только в `query-key.ts`
