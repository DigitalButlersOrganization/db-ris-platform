# UI — Mantine + кастомизация

Mantine — **runtime-компонентная база**, но визуально это **наш** продукт, не дефолтный Mantine.

## Главное правило: не импортировать Mantine-компоненты напрямую

**Запрещено** импортировать UI-компоненты из `@mantine/core`, `@mantine/dates` и других `@mantine/*` пакетов в `pages/`, `widgets/`, `features/`, `5_entities/` и прочем прикладном коде.

Если нужен любой Mantine-компонент (`Button`, `TextInput`, `Modal`, `Table`, `DatePickerInput`, …):

1. Создаём обёртку в `shared/ui/{component-name}/` (kebab-case)
2. Внутри обёртки импортируем компонент из Mantine
3. Пробрасываем props, задаём дефолты, добавляем варианты
4. Во всём приложении используем **только** `@shared/ui`

### Зачем

- Единые default props на всё приложение (size, radius, variant)
- Кастомные color variants без правок в каждом месте
- Точка для рефакторинга UI без массового поиска `@mantine/*`
- Контроль над API компонентов

### Структура обёртки

Файлы и папки — kebab-case, экспорт — PascalCase.

```text
shared/ui/
  button/
    button.tsx
    index.ts
  index.ts              # barrel: export { Button } from "./button", ...
```

```tsx
// shared/ui/button/button.tsx
import {
	Button as MantineButton,
	type ButtonProps as MantineButtonProps,
} from "@mantine/core";

export type ButtonProps = MantineButtonProps;

export function Button(props: ButtonProps) {
	return <MantineButton size="md" radius="md" {...props} />;
}
```

```ts
// shared/ui/button/index.ts
export { Button, type ButtonProps } from "./button";
```

```tsx
// ✅ features/assign-doctor/ui/assign-doctor-form.tsx
import { Button, TextInput } from "@shared/ui";

// ❌ запрещено
import { Button } from "@mantine/core";
```

### Исключения (прямой импорт из @mantine/\* разрешён)

| Файл / зона             | Что можно импортировать                              | Почему                 |
| ----------------------- | ---------------------------------------------------- | ---------------------- |
| `shared/ui/**`          | UI-компоненты Mantine                                | здесь живут обёртки    |
| `shared/theme/**`       | `createTheme`, типы theme                            | конфигурация темы      |
| `src/app/providers.tsx` | `MantineProvider`, `ModalsProvider`                    | root providers         |
| Любой файл              | `@mantine/hooks`                                       | хуки, не UI-компоненты |
| Любой файл              | `@mantine/form` (`useForm`)                            | form logic, не UI      |
| `shared/lib/notify.ts`  | `notifications` из `@mantine/notifications`            | единственная точка API |
| Любой файл              | `modals` из `@mantine/modals`                          | imperative API         |

CSS-импорты Mantine (`@mantine/core/styles.css`, …) — только в `providers.tsx`.

### ESLint

Импорт UI из Mantine блокируем через `no-restricted-imports`. Конфиг — в [eslint.config.mjs](../../eslint.config.mjs):

```js
{
  files: ["src/**/*.{ts,tsx}"],
  ignores: [
    "src/6_shared/ui/**",
    "src/6_shared/theme/**",
    "src/app/providers.tsx",
  ],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: [
          {
            name: "@mantine/core",
            message: "Import UI components from @shared/ui, not @mantine/core directly.",
          },
          {
            name: "@mantine/dates",
            message: "Import date components from @shared/ui, not @mantine/dates directly.",
          },
        ],
      },
    ],
  },
},
```

При добавлении нового Mantine UI-пакета — расширяем `paths` в ESLint.

## Пакеты

```
@mantine/core        → только через shared/ui обёртки
@mantine/dates       → только через shared/ui обёртки
@mantine/hooks       → напрямую (хуки)
@mantine/form        → напрямую (useForm)
@mantine/notifications → только через shared/lib (notify) + shared/ui (AppNotifications)
@mantine/modals      → modals.open*() напрямую
```

## Theme

Единая точка кастомизации:

```ts
// shared/theme/mantine-theme.ts (kebab-case)
import { createTheme } from "@mantine/core";

export const mantineTheme = createTheme({
	primaryColor: "brand",
	fontFamily: "var(--font-geist-sans), sans-serif",
	defaultRadius: "md",
	colors: {
		brand: [
			/* 10 shades */
		],
	},
	components: {
		Button: { defaultProps: { size: "md" } },
		TextInput: { defaultProps: { size: "md" } },
	},
});
```

Theme-level defaults дублируют/дополняют defaults в `shared/ui` обёртках. Обёртки — приоритетнее для прикладного кода.

CSS variables для бренда — в `src/app/globals.css` (Tailwind `@theme` + `:root` vars).

## Providers

```tsx
// src/app/providers.tsx
"use client";

import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { AppNotifications } from "@shared/ui";
import { mantineTheme } from "@shared/theme";

import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<MantineProvider theme={mantineTheme}>
			<ModalsProvider>
				{children}
				<AppNotifications />
			</ModalsProvider>
		</MantineProvider>
	);
}
```

## Mantine + Tailwind

- **Mantine (через shared/ui)** — интерактивные UI-компоненты
- **Tailwind** — layout utilities, spacing tweaks, one-off styling
- Не дублировать: если Mantine-компонент покрывает кейс — добавляем обёртку в `shared/ui`

## Shared UI

### Mantine-обёртки (1:1 с Mantine)

Создаём по мере необходимости, не все сразу:

```
shared/ui/button/
shared/ui/modal/
shared/ui/table/
shared/ui/badge/
shared/ui/app-shell/
shared/ui/inputs/            # все элементы форм + общий inputs.module.scss
  text-input.tsx
  select.tsx
  textarea.tsx
  inputs.module.scss
  index.ts
...
```

Элементы форм (`TextInput`, `Select`, `Textarea`, `NumberInput`, `PhoneInput`, `FileInput`) — в `inputs/` с общим файлом стилей. См. раздел [Inputs](#inputs-элементы-форм).

### Собственные composite-компоненты

| Компонент        | Назначение                             |
| ---------------- | -------------------------------------- |
| `Stack`          | Вертикальный layout + fluid gap        |
| `ContentGrid`    | Header / scrollable body / footer      |
| `PageHeader`     | Заголовок страницы + actions           |
| `EmptyState`     | Пустой список                          |
| `ErrorState`     | Ошибка загрузки + retry                |
| `LoadingOverlay` | Loading state                          |
| `DataTable`      | Table + react-table (если понадобится) |

Composite-компоненты **внутри** используют обёртки из `shared/ui`, не Mantine напрямую (кроме как через другие shared/ui модули).

**Domain-specific** UI — в `5_entities/`:

```
5_entities/appointment/ui/appointment-status-badge.tsx
```

Entity-компоненты импортируют `Badge`, `Text` и т.д. из `@shared/ui`.

## AppShell

```tsx
// shared/ui/app-shell/app-shell.tsx — Mantine AppShell wrapper
// widgets/app-shell/ui/app-shell-layout.tsx — бизнес-layout с sidebar

import { AppShell } from "@shared/ui";
import { RoleSidebar } from "@widgets/role-sidebar";
```

Layout per role group через widget, не через raw Mantine в каждой page.

## Layout и скролл: Stack

`Stack` (`@shared/ui`) — **основной строительный блок** вертикальной вёрстки. Практически любой вертикальный layout собирается через `Stack` с правильными `gap`.

Вертикальный flex (`flex-direction: column`), gap через fluid `clamp()` (дефолт `480 → 1440`, как `adapt()`).

```tsx
import { Stack } from "@shared/ui";

<Stack gap="12:24">
	<PageHeader />
	<PatientList />
</Stack>;
```

| Prop | Тип | Описание |
|------|-----|----------|
| `gap` | `"min:max"` | Fluid gap в px, например `"8:16"` → `clamp` от 8px до 16px |
| `maw` | `number` | `max-width` в px |

### Когда агент использует Stack

- **По умолчанию** для любой вертикальной композиции (формы, карточки, секции страницы)
- Вложенные `Stack` для иерархии отступов вместо ручных `margin` на каждом элементе
- Не заменяет `ContentGrid` — `Stack` про gap между блоками, `ContentGrid` про скролл и фиксированные header/footer

```tsx
<ContentGrid>
	<ContentGrid.Body>
		<Stack gap="16:24">
			<TextInput label="Имя" />
			<TextInput label="Фамилия" />
		</Stack>
	</ContentGrid.Body>
	<ContentGrid.Footer>
		<Button>Сохранить</Button>
	</ContentGrid.Footer>
</ContentGrid>
```

Gap считается через `getJsClamp()` — те же правила, что `adapt()` в SCSS. См. [styling.md](./styling.md).

## Layout и скролл: ContentGrid

Приложение залочено в высоту окна (`100vh`), **нативный скролл отключён**. Любой потенциально высокий контент скроллится **внутри** `ContentGrid`, а не страницей.

`ContentGrid` (`@shared/ui`) — compound-компонент на CSS-grid (`100%` / `max-height: 100vh`):

| Слот | Поведение |
|------|-----------|
| `ContentGrid.Header` | Фиксированная зона сверху, не скроллится |
| `ContentGrid.Body` | Скроллируемая зона (внутри Mantine `ScrollArea`), забирает всё оставшееся место |
| `ContentGrid.Footer` | Фиксированная зона снизу, всегда видима |

Все три слота опциональны — grid сам подстраивает rows под наличие header/body/footer.

```tsx
import { ContentGrid } from "@shared/ui";

<ContentGrid>
	<ContentGrid.Header>{/* заголовок, фильтры */}</ContentGrid.Header>
	<ContentGrid.Body>{/* длинный/скроллируемый контент */}</ContentGrid.Body>
	<ContentGrid.Footer>{/* кнопки действий */}</ContentGrid.Footer>
</ContentGrid>;
```

### Когда агент обязан использовать ContentGrid

Агент вставляет `ContentGrid` в создаваемые шаблоны, когда контент потенциально выше вьюпорта. Финальная вёрстка — на совести разработчика, но дефолт от агента должен защищать от переполнения.

| Зона | Использовать | Почему |
|------|-------------|--------|
| **Модальное окно** | **Всегда** | Тело модалки — `ContentGrid.Body` (скролл), кнопки — `ContentGrid.Footer` (всегда видны). Без исключений. |
| **Формы / текст в модалке** | Всегда | Контент модалки всегда скроллируемый |
| **Сайдбар / меню** | Да | Пунктов меню становится больше, на горизонтальных мобильных вёрстка ломается без скролла |
| **Списки, таблицы, длинные карточки** | Да | Любой список переменной длины |
| **Хедер** | Обычно нет | Фиксированная высота, скролл не нужен |
| **Короткий статичный блок** | Нет | Заведомо помещается во вьюпорт |

### Правило для модальных окон

**Модалка = всегда `ContentGrid`.** Контент → `ContentGrid.Body`, экшен-кнопки → `ContentGrid.Footer`. Это гарантирует, что кнопки не уедут за пределы экрана при длинной форме.

```tsx
modals.open({
	title: "Назначить врача",
	children: (
		<ContentGrid>
			<ContentGrid.Body>
				<AssignDoctorForm appointmentId={id} />
			</ContentGrid.Body>
			<ContentGrid.Footer>
				<Button onClick={handleSubmit}>Назначить</Button>
			</ContentGrid.Footer>
		</ContentGrid>
	),
});
```

## Inputs (элементы форм)

Все элементы форм (`TextInput`, `NumberInput`, `Select`, `PhoneInput`, `Textarea`, `FileInput` и т.п.) визуально однотипны: общий размер шрифта, бордеры, радиусы, вид лейблов и ошибок. Поэтому они живут вместе и делят **один** файл стилей.

### Структура

```text
6_shared/ui/inputs/
  inputs.module.scss     # общие стили всех элементов форм (один на всех)
  text-input.tsx
  select.tsx
  textarea.tsx
  number-input.tsx
  phone-input.tsx
  file-input.tsx
  index.ts               # barrel: реэкспорт всех инпутов
```

### Правила

- **Новый инпут — один файл в `6_shared/ui/inputs/`** (`{name}.tsx`). Без вложенных папок.
- **Общие стили — только в `inputs.module.scss`.** Размер шрифта, бордеры, радиусы, отступы лейбла, стиль ошибки — здесь, один раз.
- Каждый инпут — обёртка над Mantine-компонентом, прокидывает `classNames` из общего `inputs.module.scss`.
- Реэкспорт нового инпута — в `inputs/index.ts`, далее наружу через `@shared/ui`.

```tsx
// 6_shared/ui/inputs/text-input.tsx
import {
	TextInput as MantineTextInput,
	type TextInputProps as MantineTextInputProps,
} from "@mantine/core";

import classes from "./inputs.module.scss";

export type TextInputProps = MantineTextInputProps;

export function TextInput(props: TextInputProps) {
	return (
		<MantineTextInput
			classNames={{
				label: classes.label,
				input: classes.input,
				error: classes.error,
			}}
			{...props}
		/>
	);
}
```

```ts
// 6_shared/ui/inputs/index.ts
export { TextInput, type TextInputProps } from "./text-input";
export { Select, type SelectProps } from "./select";
```

```scss
// 6_shared/ui/inputs/inputs.module.scss
@use "@functions" as *;

.label {
	font-size: adapt(13, 15);
	margin-bottom: adapt(4, 6);
}

.input {
	font-size: adapt(14, 16);
	border-radius: adapt(8, 12);
}

.error {
	font-size: adapt(11, 13);
}
```

Размеры — через `adapt()` (clamp-first), см. [styling.md](./styling.md). Импорт в приложении — через `@shared/ui`.

## Forms

Mantine Form + Zod. `useForm` — напрямую из `@mantine/form`. Input-компоненты формы — из `@shared/ui`:

```tsx
import { useForm } from "@mantine/form";
import { TextInput, Button } from "@shared/ui";
import { submitVerdictSchema } from "../model/schema";

const form = useForm({
	initialValues: { diagnosis: "", conclusion: "" },
	validate: (values) => {
		/* zod validation */
	},
});

return (
	<form onSubmit={form.onSubmit(handleSubmit)}>
		<TextInput label="Диагноз" {...form.getInputProps("diagnosis")} />
		<Button type="submit">Сохранить</Button>
	</form>
);
```

## Notifications

Полная спека: [notifications.md](./notifications.md).

```tsx
import { getErrorMessage, notify } from "@shared/lib";

// success — только для значимых мутаций
notify.success("Врач назначен");

// error — вручную только вне query/mutation; API-ошибки — глобально в queryClient
notify.error(getErrorMessage(error));
```

Контейнер `<AppNotifications />` — в `providers.tsx`, не вызывать `notifications.show()` напрямую.

## Modals

```tsx
import { modals } from "@mantine/modals";

modals.openConfirmModal({
  title: "Назначить врача",
  children: <AssignDoctorForm appointmentId={id} />,
  onConfirm: () => mutation.mutate(...),
});
```

Контент модалки всегда оборачиваем в `ContentGrid` (тело — `Body`, кнопки — `Footer`). См. [Layout и скролл: ContentGrid](#layout-и-скролл-contentgrid).

## Tables

MVP: обёртки `Table` + `ScrollArea` в `shared/ui`.

Если reception queue потребует sorting/filtering/pagination — `@tanstack/react-table` + composite `DataTable` в `shared/ui`.

## Dates

Обёртка `DatePickerInput` — файл `shared/ui/inputs/date-picker-input.tsx`:

```tsx
// shared/ui/inputs/date-picker-input.tsx
import { DatePickerInput as MantineDatePickerInput } from "@mantine/dates";
// + dayjs locale setup
```

В прикладном коде:

```tsx
import { DatePickerInput } from "@shared/ui";
```

## Статусы записей

Цвета статусов — в entity, не в shared:

```tsx
// 5_entities/appointment/ui/appointment-status-badge.tsx
import { Badge } from "@shared/ui";

const STATUS_COLORS: Record<AppointmentStatus, string> = {
	pending_payment: "yellow",
	paid: "blue",
	waiting: "orange",
	in_progress: "cyan",
	completed: "green",
	cancelled: "red",
};
```

## Workflow: нужен новый Mantine-компонент

1. Проверить, есть ли обёртка в `shared/ui`
2. Если нет — создать `shared/ui/{component-name}/{component-name}.tsx` + `index.ts` (kebab-case)
3. Экспортировать из `shared/ui/index.ts`
4. Использовать `@shared/ui` в фиче/виджете/entity

## Чего не делать

- Не импортировать UI из `@mantine/core` / `@mantine/dates` вне `shared/ui` и исключений
- Не оставлять дефолтные Mantine colors/spacing без theme + wrapper defaults
- Не тащить MUI / Ant Design параллельно
- Не класть business badges в `shared/ui`
- Не обходить ESLint через `eslint-disable` для Mantine-импортов
- Не полагаться на нативный скролл страницы — он отключён; скроллируемый контент только внутри `ContentGrid.Body`
- Не верстать модалку без `ContentGrid` (кнопки уедут за экран при длинном контенте)
