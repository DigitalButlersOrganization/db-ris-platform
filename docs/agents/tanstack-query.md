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

## Invalidation rules

| Mutation | Invalidate |
|----------|------------|
| `useCreatePatient` | `patientListQueryKey()` |
| `useChangeAppointmentStatus` | `appointmentQueryKey(id)`, списки |

Инвалидируй **точечно**, не `queryClient.clear()`.

## Error handling

В UI: `isError`, `error` из query/mutation → показываем `ErrorState` из `6_shared/ui`.

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
```
