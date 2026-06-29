# AGENTS.md — db-ris-platform

Документация для AI-агентов и разработчиков. Читай этот файл первым перед любыми изменениями во фронтенде.

## Что это за проект

**db-ris-platform** — фронтенд медицинской/RIS-платформы. Backend пишет и хостит отдельная команда; фронт — самостоятельное Next.js-приложение, которое ходит во внешний REST API.

### Роли

| Роль | Что делает |
|------|------------|
| `patient` | Регистрация, выбор услуги, оплата, просмотр записей и результатов |
| `receptionist` | Очередь записей, карточка пациента, смена статуса, назначение врача |
| `doctor` | Рабочий список, карточка визита, заключение/вердикт |

### Основной флоу

```
Пациент → регистрация → выбор услуги → оплата → запись в системе
→ ресепшионист видит очередь → назначает врача
→ врач пишет вердикт → пациент видит результат
```

## Стек (кратко)

| Слой | Технология |
|------|------------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Deploy | OpenNext + Cloudflare Workers |
| Styling | Tailwind 4 + SCSS Modules + Mantine (кастомизированный) |
| Server state | TanStack Query |
| Client UI state | Zustand (только локальное, не backend-данные) |
| Forms | Mantine Form + Zod |
| HTTP | axios (`api` / `apiPrivate`) |
| Dates | dayjs |

Подробнее: [docs/agents/stack.md](docs/agents/stack.md)

## Архитектура

**FSD-lite** поверх Next.js App Router. Слои: `app → 2_pages → 3_widgets → 4_features → 5_entities → 6_shared`.

Импорты — **всегда второй уровень**: `@pages/{slice}`, `@widgets/{slice}`, `@features/{slice}`, `@entities/{slice}`, `@shared/{segment}`. У каждого слайса/сегмента обязателен `index.ts` с реэкспортами. Внутри слайса — относительные пути (избегаем циклов). См. [architecture-fsd.md](docs/agents/architecture-fsd.md#импорты-и-path-aliases).

- `src/app/` — Next.js routing, layouts, providers (не путать с FSD `pages/`)
- FSD `pages/` — композиции экранов, импортируются из `src/app/**/page.tsx`
- Импорты только вниз по слоям; cross-imports между слайсами одного слоя запрещены

Подробнее: [docs/agents/architecture-fsd.md](docs/agents/architecture-fsd.md)

## Детальная документация

| Тема | Файл |
|------|------|
| FSD-lite + Next.js | [docs/agents/architecture-fsd.md](docs/agents/architecture-fsd.md) |
| Стек и зависимости | [docs/agents/stack.md](docs/agents/stack.md) |
| TanStack Query | [docs/agents/tanstack-query.md](docs/agents/tanstack-query.md) |
| API-слой (axios) | [docs/agents/api-layer.md](docs/agents/api-layer.md) |
| Типы и Zod | [docs/agents/types-and-zod.md](docs/agents/types-and-zod.md) |
| UI / Mantine | [docs/agents/ui-mantine.md](docs/agents/ui-mantine.md) |
| Стили (clamp, SCSS) | [docs/agents/styling.md](docs/agents/styling.md) |
| Домен, роли, экраны | [docs/agents/domain-flows.md](docs/agents/domain-flows.md) |
| Правила для агентов | [docs/agents/coding-conventions.md](docs/agents/coding-conventions.md) |

## Быстрые правила для агентов

1. **Только фронт.** Backend API не трогаем; используем `NEXT_PUBLIC_API_URL`.
2. **Все backend-данные через TanStack Query.** Не `useEffect + fetch`. Каждый запрос — хук в `5_entities/{entity}/`.
3. **HTTP только через `api` / `apiPrivate`.** URL — через `apiRoute()`, ключи — из `query-key.ts`. См. [api-layer.md](docs/agents/api-layer.md).
4. **Mantine UI только через `@shared/ui`.** Прямой импорт компонентов из `@mantine/*` запрещён — см. [ui-mantine.md](docs/agents/ui-mantine.md).
   - Нативный скролл отключён (приложение залочено в `100vh`). Высокий/скроллируемый контент — через `ContentGrid` (`@shared/ui`). Модалка — **всегда** `ContentGrid` (контент в `Body`, кнопки в `Footer`).
   - Вертикальная вёрстка — через `Stack` (`@shared/ui`), gap через clamp. См. [styling.md](docs/agents/styling.md).
   - Адаптивные размеры — через `adapt()` / `getJsClamp()` (480→1440). Media queries только для layout, не для размеров.
5. **FSD-слои соблюдаем.** Новый код кладём в правильный слой и слайс.
6. **У каждого слайса — `index.ts`.** При создании page/widget/feature/entity/shared-сегмента обязательно добавить barrel с реэкспортами public API.
7. **Минимальный diff.** Не рефакторить несвязанный код.
8. **Не удалять файлы** без явного запроса.
9. **Не коммитить** без явного запроса.
10. **Не добавлять** Redux, GraphQL, react-hook-form на старте — см. [stack.md](docs/agents/stack.md).

## Env

```env
NEXT_PUBLIC_API_URL=https://api.example.com
```

## Структура src/ (целевая)

```text
src/
  app/                  # Next.js App Router
    (public)/
    (patient)/
    (reception)/
    (doctor)/
    providers.tsx
  2_pages/              # {slice}/index.ts
  3_widgets/            # {slice}/index.ts
  4_features/           # {slice}/index.ts
  5_entities/           # хуки + types/index.ts + index.ts
  6_shared/             # {segment}/index.ts
    api/                # api, apiPrivate, api-routes, query-key
    config/
    lib/
    ui/
    theme/
    styles/             # functions.scss — @use "@functions"
```

## Ссылки

- [Feature-Sliced Design](https://fsd.how/ru/docs/get-started/overview/)
- [TanStack Query + FSD](https://fsd.how/ru/docs/guides/tech/with-tanstack-query/)
- [Next.js + FSD](https://fsd.how/ru/docs/guides/tech/with-nextjs/)
