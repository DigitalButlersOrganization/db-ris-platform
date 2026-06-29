# FSD-lite + Next.js App Router

Методология: [Feature-Sliced Design](https://fsd.how/ru/docs/get-started/overview/). Используем **FSD-lite** — без слоя `processes` (устарел), без фанатичного линтера на старте.

## Слои (сверху вниз)

| Слой | Назначение | Пример |
|------|------------|--------|
| `app` | Next.js routing, layouts, providers, middleware | `src/app/(doctor)/doctor/page.tsx` |
| `2_pages` | FSD-композиции экранов | `src/2_pages/doctor-worklist/ui/doctor-worklist-page.tsx` |
| `3_widgets` | Крупные UI-блоки сценариев | `reception-queue-table`, `doctor-visit-panel` |
| `4_features` | Действия пользователя (бизнес-ценность) | `assign-doctor`, `submit-verdict`, `pay-appointment` |
| `5_entities` | Бизнес-сущности + API-хуки + типы | `patients`, `appointment`, `doctor` |
| `6_shared` | Инфраструктура без бизнес-логики | `api`, `ui`, `lib`, `config`, `theme` |

**Правило импортов:** модуль может импортировать только из слоёв **ниже**. Слайсы одного слоя **не импортируют** друг друга.

## Next.js vs FSD `pages`

`src/app/` — это **Next.js App Router**, не FSD-слой `pages`.

FSD `pages/` — это **композиции**, которые импортируются в Next route files:

```tsx
// src/app/(doctor)/doctor/page.tsx
import { DoctorWorklistPage } from "@pages/doctor-worklist";

export default DoctorWorklistPage;
```

Next `layout.tsx` / `providers.tsx` живут в `src/app/` и относятся к FSD-слою `app`.

## Структура слайса

Каждый слайс (кроме `6_shared` и `app`) имеет сегменты:

```text
5_entities/patients/
  use-get-patient-list.ts    # useGetPatientList
  use-create-patient.ts      # useCreatePatient
  types/
    index.ts                 # Zod-схемы, *Values, *Payload, *Response
  ui/
    patient-card.tsx
  index.ts                   # public API слайса
```

Query keys — централизованно в `src/6_shared/api/query-key.ts`, не в entity-слайсе.
Типы — только в `types/index.ts`, см. [types-and-zod.md](./types-and-zod.md).

### Public API

Каждый слайс экспортирует наружу только через `index.ts`:

```ts
// 5_entities/patients/index.ts
export { useGetPatientList } from "./use-get-patient-list";
export { useCreatePatient } from "./use-create-patient";
export type { Patient, AddPatientValues } from "./types";
export { PatientCard } from "./ui/patient-card";
```

Внешний код импортирует `@entities/patients`, не `@entities/patients/use-get-patient-list`.

## Целевая структура проекта

```text
src/
  app/
    (public)/
      page.tsx
      login/page.tsx
      register/page.tsx
      services/page.tsx
    (patient)/patient/
      page.tsx
      appointments/page.tsx
      appointments/[id]/page.tsx
    (reception)/reception/
      page.tsx
      appointments/[id]/page.tsx
    (doctor)/doctor/
      page.tsx
      visits/[id]/page.tsx
    providers.tsx
    layout.tsx
    globals.css

  2_pages/
    doctor-worklist/
      index.ts
    reception-queue/
      index.ts

  3_widgets/
    role-sidebar/
      index.ts
    reception-queue-table/
      index.ts

  4_features/
    assign-doctor/
      index.ts
    pay-appointment/
      index.ts

  5_entities/
    patients/
    doctor/
    service/
    appointment/
    payment/
    medical-verdict/

  6_shared/
    api/
      api.ts
      api-routes.ts
      query-key.ts
      query-client.ts
    auth/
      session.ts
      guards.ts
      permissions.ts
    config/
      env.ts
    lib/
      dates.ts
      format.ts
    ui/
      PageHeader/
      EmptyState/
      ErrorState/
    theme/
      mantine-theme.ts
```

## Route groups по ролям

| Group | Prefix | Роли |
|-------|--------|------|
| `(public)` | `/`, `/login`, `/register`, `/services` | Все |
| `(patient)` | `/patient/*` | `patient` |
| `(reception)` | `/reception/*` | `receptionist` |
| `(doctor)` | `/doctor/*` | `doctor` |

Auth guard — в layout каждой группы + `6_shared/auth/guards.ts`.

## Где что класть — decision tree

```
Это Next.js route/layout/provider?     → src/app/
Это полная страница (композиция)?       → 2_pages/{name}/
Это крупный самостоятельный блок UI?    → 3_widgets/{name}/
Это действие пользователя?              → 4_features/{action-name}/
Это бизнес-сущность (данные + UI)?      → 5_entities/{entity}/
Это инфраструктура / примитив?          → 6_shared/{segment}/
```

## Cross-imports

Запрещено:

```ts
// ❌ feature импортирует feature
import { PayAppointmentButton } from "@features/pay-appointment";

// ❌ entity импортирует entity (напрямую)
import { PatientCard } from "@entities/patient";
```

Разрешено:

```ts
// ✅ feature импортирует entity
import { AppointmentCard } from "@entities/appointment";

// ✅ widget импортирует features + entities
import { AssignDoctorForm } from "@features/assign-doctor";
import { AppointmentCard } from "@entities/appointment";
```

Если двум entities нужна общая логика — выносим в `@shared/lib`.

## Импорты и path aliases

Алиасы в `tsconfig.json` — **всегда второй уровень** (`@layer/slice`):

| Alias | Цель | Пример импорта |
|-------|------|----------------|
| `@pages/*` | `src/2_pages/*` | `@pages/doctor-worklist` |
| `@widgets/*` | `src/3_widgets/*` | `@widgets/role-sidebar` |
| `@features/*` | `src/4_features/*` | `@features/assign-doctor` |
| `@entities/*` | `src/5_entities/*` | `@entities/patients` |
| `@shared/*` | `src/6_shared/*` | `@shared/ui`, `@shared/api` |

### Единое правило

Импорт **только** через alias + `index.ts` слайса/сегмента. Не лезть вглубь файловой структуры:

```ts
// ✅
import { DoctorWorklistPage } from "@pages/doctor-worklist";
import { AssignDoctorForm } from "@features/assign-doctor";
import { ReceptionQueueTable } from "@widgets/reception-queue-table";
import { useGetPatientList } from "@entities/patients";
import { Button, TextInput } from "@shared/ui";
import { apiPrivate, apiRoute } from "@shared/api";

// ❌
import { DoctorWorklistPage } from "@pages/doctor-worklist/ui/doctor-worklist-page";
import { useGetPatientList } from "@entities/patients/use-get-patient-list";
import { apiPrivate } from "@shared/api/api";
```

### Обязательный `index.ts` на каждом слайсе

**Агенты обязаны** создавать `index.ts` с реэкспортами public API при добавлении любого слайса:

| Слой | Путь | Пример |
|------|------|--------|
| Page | `2_pages/{name}/index.ts` | `2_pages/doctor-worklist/index.ts` |
| Widget | `3_widgets/{name}/index.ts` | `3_widgets/role-sidebar/index.ts` |
| Feature | `4_features/{name}/index.ts` | `4_features/assign-doctor/index.ts` |
| Entity | `5_entities/{name}/index.ts` | `5_entities/patients/index.ts` |
| Shared segment | `6_shared/{segment}/index.ts` | `6_shared/api/index.ts` |

Пример page-слайса:

```text
2_pages/doctor-worklist/
  ui/doctor-worklist-page.tsx
  index.ts    # export { DoctorWorklistPage } from "./ui/doctor-worklist-page"
```

Пример feature-слайса:

```text
4_features/assign-doctor/
  ui/assign-doctor-form.tsx
  index.ts    # export { AssignDoctorForm } from "./ui/assign-doctor-form"
```

Barrel-слоя (`2_pages/index.ts` на весь слой) **нет** — только per-slice `index.ts`.

### Циклические импорты

Barrel (`index.ts`) легко создаёт циклы. Если модуль внутри **того же слайса/сегмента** импортирует соседа — **относительный путь**, не barrel:

```ts
// 6_shared/ui/title/title.tsx
// ✅ сосед по сегменту
import { Text } from "../text/text";

// ❌ через barrel того же сегмента → цикл index → Title → index
import { Text } from "@shared/ui";
```

Правило: **alias/barrel — только для пересечения границы** (другой слой / другой слайс / другой сегмент). **Внутри** границы — относительные пути.

Симптомы цикла: `Cannot access 'X' before initialization`, `undefined` вместо компонента, падения, зависящие от порядка экспортов.

## Линтер: enforcement границ

Правила FSD не на честном слове — их проверяет **`eslint-plugin-boundaries`** (конфиг в [eslint.config.mjs](../../eslint.config.mjs)). `pnpm lint` падает при нарушении.

### Что проверяется

| Правило | Что ловит |
|---------|-----------|
| `boundaries/dependencies` | импорт «вверх» по слоям и cross-slice внутри одного слоя |
| `no-restricted-imports` (regex `@layer/<slice>/<internal>`) | импорт мимо public API слайса |

Слои описаны как `boundaries/elements` (`app`, `pages`, `widgets`, `features`, `entities`, `shared`), разрешённые зависимости — `default: "disallow"` + явные `allow` сверху вниз:

```text
app      → pages, widgets, features, entities, shared
pages    → widgets, features, entities, shared
widgets  → features, entities, shared
features → entities, shared
entities → shared
shared   → shared
```

Relative-импорты внутри слайса (`internal` / `child` / `parent`) разрешены; `sibling` (другой слайс того же слоя) — запрещён.

### Примеры ошибок линтера

```ts
// ❌ FSD violation: features cannot import features
import { X } from "@features/other-feature";

// ❌ cross-slice within the same layer is forbidden
//    (из 5_entities/appointment в 5_entities/patients)
import { Patient } from "@entities/patients";  // если ты внутри entities/appointment

// ❌ Import via public API (@layer/<slice>), not internal files
import { useGetPatientList } from "@entities/patients/use-get-patient-list";

// ✅ через public API
import { useGetPatientList } from "@entities/patients";
```

> Резолв алиасов для линтера — через `eslint-import-resolver-typescript` (читает `paths` из `tsconfig.json`).

## Постепенное внедрение

1. Создать `6_shared/` (api, theme, ui primitives)
2. Создать `5_entities/` для ключевых сущностей
3. Создать `4_features/` для user actions
4. Собрать `2_pages/` и подключить к `src/app/`
5. Добавить `3_widgets/` по мере роста экранов

Не рефакторить всё сразу. Новый код — сразу по FSD.
