# TanStack Query

Все backend-данные — **только** через TanStack Query. Никаких `useEffect + fetch`.

См. также: [api-layer.md](./api-layer.md) — HTTP-клиент, routes, query keys.

## Setup

```tsx
// src/app/providers.tsx
"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@shared/api";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
    </QueryClientProvider>
  );
}
```

```ts
// src/6_shared/api/query-client.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

## Где живут queries

| Что | Где |
|-----|-----|
| Query keys | `src/6_shared/api/query-key.ts` |
| Query / mutation hooks | `5_entities/{entity}/use-{verb}-{entity}.ts` |
| HTTP client (axios) | `src/6_shared/api/api.ts` |
| API routes | `src/6_shared/api/api-routes.ts` |
| QueryClient instance | `src/6_shared/api/query-client.ts` |

**Каждый запрос — отдельный хук** в entity-слайсе. Queries и mutations для сущности живут рядом.

## Query keys

Все ключи — в `query-key.ts`. Первый элемент — `QUERY_KEY`:

```ts
// src/6_shared/api/query-key.ts
export enum QUERY_KEY {
  PATIENT_LIST = "patient_list",
  PATIENT = "patient",
}

export const patientListQueryKey = (filters?: unknown) =>
  createQueryKey(QUERY_KEY.PATIENT_LIST, filters);

export const patientQueryKey = (id: string) =>
  createQueryKey(QUERY_KEY.PATIENT, id);
```

Импорт ключей только из `query-key.ts`. Inline `queryKey: [...]` в хуках запрещён.

## Query hooks (entities)

```ts
// 5_entities/patients/use-get-patient-list.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiPrivate, apiRoute, patientListQueryKey } from "@shared/api";
import type { Patient } from "./types";

export function useGetPatientList() {
  return useQuery({
    queryKey: patientListQueryKey(),
    queryFn: () =>
      apiPrivate
        .get<Patient[]>(apiRoute("PATIENT", "GET_LIST"))
        .then((r) => r.data),
  });
}
```

## Mutation hooks (entities)

```ts
// 5_entities/patients/use-create-patient.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPrivate, apiRoute, patientListQueryKey } from "@shared/api";

export function useCreatePatient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePatientPayload) =>
      apiPrivate
        .post<Patient>(apiRoute("PATIENT", "CREATE"), payload)
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientListQueryKey() });
    },
  });
}
```

## HTTP-клиент

- `api` — публичные запросы
- `apiPrivate` — с Bearer-токеном

Подробнее: [api-layer.md](./api-layer.md).

## Invalidation после mutations

**Обязательно** инвалидировать все связанные query keys в `onSuccess` (или `onSettled` после optimistic update). Если мутация меняет сущность — подумай, какие экраны/списки/детали от неё зависят.

| Mutation | Invalidate |
|----------|------------|
| `useCreatePatient` | `patientListQueryKey()` |
| `useChangePatientStatus` | `patientQueryKey(id)`, `patientListQueryKey()` |
| `useAssignDoctor` | `appointmentQueryKey(id)`, очередь ресепшена, worklist врача |

### Чеклист для агента

После каждой mutation в `onSuccess` / `onSettled`:

1. **Деталь** — `*QueryKey(id)` изменённой сущности
2. **Списки** — все list-ключи, где эта сущность видна
3. **Смежные сущности** — если мутация затрагивает связанные данные (пациент + запись, оплата + статус записи)
4. **Счётчики / агрегаты** — если есть отдельные ключи

Инвалидируй **точечно**, не `queryClient.clear()`. Пропуск связанного ключа — баг: UI покажет устаревшие данные.

```ts
onSuccess: (_, { patientId }) => {
  queryClient.invalidateQueries({ queryKey: patientQueryKey(patientId) });
  queryClient.invalidateQueries({ queryKey: patientListQueryKey() });
},
```

## Optimistic updates

Для **простых** мутаций — переключение свитчера, переименование, смена статуса, изменение одного поля — используй **optimistic update** через `onMutate`, а не жди ответа сервера.

| Подходит для optimistic | Лучше без optimistic |
|-------------------------|----------------------|
| toggle / switch | create (новая сущность) |
| rename / change field | delete |
| change status | сложная форма с валидацией |
| assign / unassign | payment / критичные операции |

### Паттерн

1. `onMutate` — отменить исходящие refetch, сохранить snapshot, обновить cache
2. Вернуть **контекст** (snapshot) из `onMutate`
3. `onError` — откатить cache из контекста
4. `onSettled` — `invalidateQueries` по связанным ключам (сервер — source of truth)

```ts
// 5_entities/patients/use-change-patient-status.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPrivate, apiRoute, patientListQueryKey, patientQueryKey } from "@shared/api";
import type { Patient } from "./types";

type MutationContext = {
  previousList?: Patient[];
  previousDetail?: Patient;
};

export function useChangePatientStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ patientId, status }: { patientId: string; status: string }) =>
      apiPrivate
        .patch(apiRoute("PATIENT", "UPDATE"), { patientId, status })
        .then((r) => r.data),

    onMutate: async ({ patientId, status }) => {
      await queryClient.cancelQueries({ queryKey: patientListQueryKey() });
      await queryClient.cancelQueries({ queryKey: patientQueryKey(patientId) });

      const previousList = queryClient.getQueryData<Patient[]>(patientListQueryKey());
      const previousDetail = queryClient.getQueryData<Patient>(patientQueryKey(patientId));

      queryClient.setQueryData<Patient[]>(patientListQueryKey(), (list) =>
        list?.map((patient) =>
          patient.id === patientId ? { ...patient, status } : patient,
        ),
      );

      queryClient.setQueryData<Patient>(patientQueryKey(patientId), (patient) =>
        patient ? { ...patient, status } : patient,
      );

      return { previousList, previousDetail } satisfies MutationContext;
    },

    onError: (_error, { patientId }, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(patientListQueryKey(), context.previousList);
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(patientQueryKey(patientId), context.previousDetail);
      }
    },

    onSettled: (_data, _error, { patientId }) => {
      queryClient.invalidateQueries({ queryKey: patientListQueryKey() });
      queryClient.invalidateQueries({ queryKey: patientQueryKey(patientId) });
    },
  });
}
```

### Immer — нужен ли?

**Нет, не стандартизируем.** Для типичных optimistic-мутаций (одно поле, статус, toggle) достаточно spread:

```ts
{ ...patient, status: newStatus }
list?.map((item) => (item.id === id ? { ...item, field } : item))
```

Immer имеет смысл только если обновляешь **глубоко вложенные** структуры и spread становится нечитаемым. Тогда — точечно, по запросу, не как дефолт для всех mutations. Зависимость в проект **не добавляем** без явной необходимости.

## HTTP-клиент

Ошибки query/mutation показываются **глобально** через `QueryCache` / `MutationCache` в `query-client.ts` → `notify.error(getErrorMessage(error))`. Подробнее: [notifications.md](./notifications.md).

В хуках **не дублировать** `onError` с `notify.error`.

В UI параллельно обрабатываем состояния экрана: `isError` → `ErrorState` + retry (см. [coding-conventions.md](./coding-conventions.md)).

### Success-уведомления в mutations

Только для значимых изменений данных (create / update / delete / assign):

```ts
// 5_entities/patients/use-create-patient.ts
import { notify } from "@shared/lib";

return useMutation({
  mutationFn: ...,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: patientListQueryKey() });
    notify.success("Пациент создан");
  },
});
```

Фильтры, сортировка, refetch — без success toast.

## Polling

```ts
useQuery({
  queryKey: appointmentQueryKey(id),
  queryFn: () => fetchAppointment(id),
  refetchInterval: (query) =>
    query.state.data?.status === "pending_payment" ? 3000 : false,
});
```

## Запрещено

```ts
// ❌ raw fetch в компоненте
useEffect(() => { fetch("/api/...").then(...) }, []);

// ❌ хранить backend-данные в Zustand
const store = create(() => ({ appointments: [] }));

// ❌ inline queryKey
useQuery({ queryKey: ["patients", "list"], ... });

// ❌ hardcoded URL
api.get("/patient/list");

// ❌ mutation без invalidate связанных keys
onSuccess: () => { /* ничего */ }

// ❌ ждать ответ сервера для простого toggle вместо optimistic update
```
