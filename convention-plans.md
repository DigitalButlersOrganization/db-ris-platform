# План улучшений документации для агентов

Живой бэклог по результатам аудита agent-docs (оценка **74 / 100**).  
Цель: не потерять рекомендации; возвращаться к пунктам по мере приоритета.

**Легенда статусов:** `[ ]` — не сделано · `[~]` — частично · `[x]` — сделано

---

## Исходная оценка (baseline)

| Критерий | Балл | Комментарий |
|----------|------|-------------|
| Полнота покрытия стека | 78 | Хорошо по data/UI слоям, слабо по auth, deploy, RSC |
| Операционность (примеры, anti-patterns) | 85 | TanStack Query и API — эталон |
| Согласованность между доками | 65 | Противоречия patient/patients, modals, schema location |
| Соответствие реальному коду | 55 | Док описывает целевое состояние, код — заготовку |
| Enforcement (lint/CI) | 60 → **~75** | FSD boundaries добавлены; relative bypass остаётся |
| Домен + бизнес-флоу | 75 | Есть entities, routes, mermaid; API — «ориентир» |
| Edge cases / troubleshooting | 40 | Нет FAQ, нет «если агент сделал X» |
| Onboarding агента на задачу | 80 | AGENTS.md + ссылки работают |

**Итого baseline: ~74/100** — выше типичного AGENTS.md, но enforcement и doc↔code gap — главные риски.

---

## Что уже хорошо (не ломать, только поддерживать)

- [x] **AGENTS.md** — входная точка, 10 быстрых правил, карта ссылок
- [x] **architecture-fsd.md** — decision tree, cross-imports, barrel + циклы, path aliases
- [x] **tanstack-query.md** — keys, invalidation checklist, optimistic pattern, anti-patterns
- [x] **api-layer.md** — `api`/`apiPrivate`, `apiRoute`, keys; ESLint на axios/URL/queryKey
- [x] **types-and-zod.md** — naming, Values/Payload, `*_FIELDS`, пример `types/index.ts`
- [x] **ui-mantine.md** — wrapper-first, Stack/ContentGrid, inputs
- [x] **styling.md** — clamp-first, media только для layout
- [x] **notifications.md** — архитектура, глобальные ошибки, когда success toast
- [x] **domain-flows.md** — сущности, статусы, routes MVP, mermaid
- [x] **coding-conventions.md** — naming, import order, checklist перед PR

Сильная сторона всего набора: **операционные правила с примерами ✅/❌**, а не абстрактные best practices.

---

## Сделано в рамках сессии (2026-06-29)

### Код и линтер

- [x] **FSD import boundaries** — `eslint-plugin-boundaries` + `eslint-import-resolver-typescript` в `eslint.config.mjs`
  - `boundaries/dependencies`: слои app → pages → widgets → features → entities → shared
  - запрет cross-slice (`sibling`) внутри одного слоя
  - `no-restricted-imports` regex: глубокие алиасы `@layer/slice/internal` запрещены
- [x] Починен баг: `mantineUiRules` затирал запрет `axios` в flat config (объединены правила)
- [x] `pnpm lint` → `eslint src` (Next 16 убрал `next lint`)
- [x] Flat config Next 16 вместо сломанного `FlatCompat`

### Документация

- [x] **architecture-fsd.md** — секция «Линтер: enforcement границ» (таблица правил, схема слоёв, примеры ошибок)
- [x] **Удалён Tailwind** из стека и всех agent-docs:
  - `AGENTS.md`, `stack.md`, `styling.md`, `ui-mantine.md`
  - причина зафиксирована: конфликт с `@shared/ui`-обёртками, единый источник — SCSS + `@functions`
  - `stack.md`: Tailwind в таблице «Что НЕ добавлять»

### Инфра (не дока, но влияет на агентов)

- [x] SCSS `@functions` alias: Turbopack — относительный путь, Webpack — абсолютный (`next.config.ts`)
- [x] `functions.scss`: `math.div()` вместо устаревшего `/` (Dart Sass 2.0)

---

## P0 — высокий ROI (рекомендуется следующим)

### 1. `docs/agents/current-state.md` — doc vs code

**Проблема:** док описывает полную FSD-структуру (`2_pages`, `3_widgets`, `4_features`, `shared/auth`, routes), в репо ~30+ файлов-заготовок. Агент ищет `guards.ts` / `useSessionQuery` и не находит, или наоборот генерит лишние слайсы.

**Содержание файла:**
- таблица «есть сейчас» vs «целевое / ещё не создано»
- какие routes реально подключены
- какие entity-слайсы существуют
- ссылка из `AGENTS.md` в начале «Быстрых правил»

- [ ] Создать `current-state.md`
- [ ] Добавить ссылку в `AGENTS.md`

### 2. Вычистить противоречия между доками

| Место | Противоречие | Исправление |
|-------|--------------|-------------|
| `domain-flows.md` | entity `patient` | Везде `patients` (как в коде и `architecture-fsd.md`) |
| `architecture-fsd.md` cross-import пример | `@entities/patient` | `@entities/patients` |
| `ui-mantine.md` Forms | `import from "../model/schema"` | Схемы в `5_entities/{entity}/types/index.ts` ([types-and-zod.md](docs/agents/types-and-zod.md)) |
| `ui-mantine.md` Modals | правило «всегда ContentGrid», пример `openConfirmModal` без него | Привести все примеры модалок к ContentGrid |
| `tanstack-query.md` vs `notifications.md` | граница success toast для status change | Единая таблица «показываем / не показываем» |

- [ ] Пройтись по таблице и синхронизировать

### 3. `docs/agents/auth.md` (новый файл)

**Проблема:** в `domain-flows.md` упомянуты `guards.ts`, `permissions.ts`, `useSessionQuery()`, но отдельного гайда нет, в коде auth-сегмента нет.

**Минимальное содержание (даже до реализации):**
- где будет жить auth (`6_shared/auth/`)
- token storage, `apiPrivate` interceptors, flow 401
- `useSessionQuery` / guard в layout route groups
- `Role` и `ROUTE_ACCESS`
- что агент **не делает** (свой auth с нуля, localStorage без конвенции)

- [ ] Создать `auth.md` (skeleton или полный — по готовности кода)
- [ ] Ссылка в `AGENTS.md` и `domain-flows.md`

### 4. `docs/agents/server-client.md` (новый файл)

**Проблема:** одна строка «`use client` только где нужно» — агенты ставят client на пол-аппы.

**Содержание:**
- default: Server Components в `page.tsx` / layouts
- когда `"use client"`: hooks, browser APIs, Mantine interactive, TanStack Query consumers
- где providers (`src/app/providers.tsx`)
- паттерн: тонкий server `page.tsx` → client widget/page composition
- anti-patterns: `"use client"` на всём дереве без причины

- [ ] Создать `server-client.md`
- [ ] Ссылка в `AGENTS.md` и `coding-conventions.md`

### 5. Усилить enforcement (остатки)

- [ ] `boundaries/no-unknown-files: error` — файлы вне FSD-слоёв ловятся линтером
- [ ] Документировать в `architecture-fsd.md`: relative bypass (`../../4_features/...`) **не** ловится boundaries; если критично — отдельная задача (custom rule / запрет `../` за пределы слайса)
- [ ] Обновить `api-layer.md`: секция ESLint (axios, queryKey, **+ boundaries**)

---

## P1 — важно, но можно после P0

### 6. Границы feature / widget / page

**Проблема:** decision tree есть, серая зона не разобрана.

Добавить в `architecture-fsd.md` (или отдельный `slice-placement.md`):
- форма в `feature/ui` vs `entity/ui`
- когда нужен `model/` в feature
- wizard: widget vs feature vs page
- примеры из домена: `assign-doctor` = feature, `reception-queue-table` = widget

- [ ] Расширить architecture или новый файл
- [ ] 2–3 concrete examples с путями

### 7. Zustand — где и как

**Проблема:** «только локальный UI-state» без паттерна.

Добавить в `stack.md` или `coding-conventions.md`:
- файл: `4_features/{name}/model/{name}-store.ts` или `6_shared/lib/...` только для truly global UI
- naming: `useXxxStore`
- запрет: backend-данные, дублирование query cache
- пример: sidebar open, wizard step

- [ ] Документировать конвенцию

### 8. API-контракт (ориентир → spec)

**Проблема:** endpoints в `domain-flows.md` — «ориентир»; формат ошибок, пагинация, auth flow не описаны.

- [ ] `docs/agents/api-contract.md` или секция в `api-layer.md`:
  - формат ошибок (`getErrorMessage` → будущий разбор AxiosError)
  - пагинация / фильтры (query params convention)
  - auth headers
  - «источник правды» — backend OpenAPI (когда появится)

### 9. OpenNext / Cloudflare runtime

**Проблема:** в `stack.md` deploy упомянут, ограничений нет.

- [ ] Секция в `stack.md` или `docs/agents/deploy-cloudflare.md`:
  - edge runtime constraints
  - запрещённые Node API
  - env на Workers
  - `pnpm deploy` / preview flow

### 10. Примеры «завершённых» слайсов

**Проблема:** только aspirational structure; агент не видит эталон end-to-end.

- [ ] Эталонный walkthrough: `5_entities/patients` (уже частично есть) — дополнить до «reference slice»
- [ ] Когда появится первый feature — задокументировать как reference `4_features/assign-doctor`

---

## P2 — качество жизни агентов

### 11. Troubleshooting / FAQ для агентов

`docs/agents/troubleshooting.md`:
- циклический import через barrel → relative внутри слайса
- `boundaries/dependencies` error — как читать сообщение
- mutation без invalidate → stale UI
- модалка без ContentGrid → кнопки за экраном
- `@functions` not found → проверить `next.config.ts` alias

- [ ] Создать troubleshooting.md

### 12. Тестирование (когда появится)

`coding-conventions.md` уже говорит «future». Когда включим:
- vitest + testing-library conventions
- где мокать `@shared/api`
- E2E playwright — scope

- [ ] Обновить при появлении test infra

### 13. a11y и i18n

Сейчас **не упомянуты**. Добавить только когда появится решение в продукте:
- [ ] a11y: Mantine defaults, focus, aria в forms
- [ ] i18n: стратегия (или явно «MVP без i18n, copy на русском hardcoded»)

### 14. ESLint в ui-mantine.md

- [ ] Синхронизировать пример `eslint.config.mjs` с актуальным (boundaries block, не только mantine paths)
- [ ] Упомянуть FSD boundaries рядом с Mantine `no-restricted-imports`

### 15. AGENTS.md — быстрые правила

- [ ] Пункт про FSD enforcement: «нарушения ловит `pnpm lint`»
- [ ] Пункт «не добавлять Tailwind» (дублирует stack.md кратко)
- [ ] Ссылка на `current-state.md` когда появится

---

## Слишком строго — пересмотреть формулировки (не ослаблять lint без причины)

Эти правила **архитектурно верны**, но для агентов создают трение. Варианты: смягчить текст доки, добавить шаблоны/scaffolding, не ослаблять ESLint.

| Правило | Риск для агента | Рекомендация в доке |
|---------|-----------------|---------------------|
| Каждый Mantine UI → обёртка в `shared/ui` | 3 файла на каждый новый `Checkbox` | Fast-path: «сначала проверь `@shared/ui`; если нет — создай по шаблону `button/`» |
| Optimistic update обязателен для простых мутаций | optimistic на create/delete | Уточнить таблицу в `tanstack-query.md`: «обязателен» = toggle/rename/status, не все PATCH |
| Values + Payload всегда раздельно | церемония при 1:1 | «Даже при равенстве — отдельный type alias одной строкой» |
| `*_FIELDS` enum на каждую форму | overkill для 2 полей | «Обязателен для форм ≥3 полей или переиспользуемых» |
| 480→1440 не переопределять | жёстко | Добавить escape: «только по явному запросу в задаче» |
| Modal = всегда ContentGrid | примеры расходятся | [~] правило верное; [ ] синхронизировать примеры (см. P0.2) |

---

## Слишком вольно — где агенты «чудят» (усилить доку или lint)

| Дыра | Типичный косяк | Статус / действие |
|------|----------------|-------------------|
| FSD layer imports | feature → feature | [x] `eslint-plugin-boundaries` |
| Deep alias `@layer/slice/file` | обход barrel | [x] regex в `no-restricted-imports` |
| Relative cross-layer `../../4_features/` | обход алиасов | [ ] не ловится; документировать + optional custom rule |
| Zod parse ответов «точечно» | везде `.parse()` или нигде | [ ] чёткий чеклист в `types-and-zod.md` |
| `use client` без правил | client на всё | [ ] `server-client.md` |
| Invalidation keys | выдуманные `*QueryKey` | [ ] при добавлении entity — чеклист «добавь key в query-key.ts» |
| `@mantine/hooks` везде | `useDisclosure` в entity | [ ] «hooks в feature/page, не в entity UI» |
| `modals` без обёртки | inconsistent с notifications | [ ] зафиксировать паттерн в ui-mantine.md |
| Feature `model/` vs entity `types/` | дублирование схем | [ ] slice-placement + types-and-zod cross-link |
| Success toast на каждый PATCH | шум | [x] таблица есть; [ ] синхронизировать edge cases |
| Файлы вне FSD | мусор в `src/` | [ ] `no-unknown-files` |

---

## Противоречия doc ↔ code (живой список)

Обновлять при росте репозитория.

| Документация | Код сейчас | Действие |
|--------------|------------|----------|
| `6_shared/auth/` | нет | auth.md skeleton + current-state |
| `2_pages/`, `3_widgets/`, `4_features/` | нет слайсов | current-state |
| `shared/theme/` | нет | current-state |
| Routes из `domain-flows.md` | только `/` | current-state |
| `admin` role в permissions | нет в AGENTS.md roles table | синхронизировать или убрать admin |
| ESLint FSD | [x] реализован | [x] architecture-fsd.md |
| Tailwind в стеке | [x] удалён | [x] docs обновлены |

---

## Идеальный порядок работ (если идти по одному)

1. [~] FSD lint — **сделано**
2. [~] Tailwind out of docs — **сделано**
3. [ ] `current-state.md`
4. [ ] Противоречия (patient/patients, modals, schema)
5. [ ] `auth.md` skeleton
6. [ ] `server-client.md`
7. [ ] `no-unknown-files` + api-layer.md ESLint section
8. [ ] slice-placement / Zustand / api-contract / deploy — по мере роста продукта
9. [ ] troubleshooting.md

---

## Ссылки на ключевые файлы

| Тема | Файл |
|------|------|
| Вход | [AGENTS.md](AGENTS.md) |
| FSD + lint | [docs/agents/architecture-fsd.md](docs/agents/architecture-fsd.md) |
| ESLint config | [eslint.config.mjs](eslint.config.mjs) |
| SCSS alias | [next.config.ts](next.config.ts) |
| Стили | [docs/agents/styling.md](docs/agents/styling.md) |
| Стек | [docs/agents/stack.md](docs/agents/stack.md) |

---

*Последнее обновление плана: 2026-06-29 (после аудита + FSD lint + удаление Tailwind + fix SCSS build).*
