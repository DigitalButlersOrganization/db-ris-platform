# Стили: clamp-first

Правила адаптивной вёрстки для агентов и разработчиков.

## SCSS-функции и миксины

Файл: `src/6_shared/styles/functions.scss`

Подключение в любом `.module.scss`:

```scss
@use "@functions" as *;
```

Alias `@functions` настроен в `next.config.ts` (webpack resolve + `sassOptions.includePaths`).

### `adapt($minValue, $maxValue, $fromWidth: 480, $toWidth: 1440)`

Fluid-значение через `clamp()`: линейная интерполяция между `$minValue` (при 480px) и `$maxValue` (при 1440px).

```scss
@use "@functions" as *;

.title {
	font-size: adapt(20, 32);
	padding: adapt(12, 24);
}
```

**Дефолтные брейкпоинты `480` и `1440` не переопределять**, если разработчик явно не попросил иное.

### Миксины

| Миксин | Назначение |
|--------|------------|
| `flex-center` | flex + center по обеим осям |
| `cover` | absolute fill + `object-fit: cover` |
| `contain` | absolute fill + `object-fit: contain` |
| `line-clamp($lines)` | обрезка текста по строкам |

## Clamp-first: главное правило

**Всё, что можно выразить через clamp — выражаем через clamp.** Размеры, отступы, gap, font-size, padding, margin, max-width и т.д.

- В SCSS: `adapt($min, $max)` из `@functions`
- В TS/inline styles: `getJsClamp(min, max)` из `@shared/lib` (те же дефолты 480 / 1440)

```ts
import { getJsClamp } from "@shared/lib";

const fontSize = getJsClamp(14, 18); // clamp(0.875rem, …, 1.125rem)
```

Агент **обязан** использовать clamp-утилиты при создании шаблонов с адаптивными размерами. Не хардкодить фиксированные px/rem там, где значение должно плавно меняться между мобилкой и десктопом.

## Media queries — только когда clamp не помогает

`@media` — для того, что **нельзя** выразить clamp'ом:

- смена `position` / `display` / `flex-direction`
- порядок элементов (`order`)
- показ/скрытие блоков (`display: none`)
- сетка с разным количеством колонок
- hover/focus состояния

```scss
// ✅ clamp для размера
.card {
	padding: adapt(12, 24);
}

// ✅ media для layout
@media (max-width: 768px) {
	.sidebar {
		position: fixed;
	}
}

// ❌ media для font-size, если можно adapt()
@media (min-width: 768px) {
	.title {
		font-size: 32px;
	}
}
```

## CSS Modules vs Tailwind

| Инструмент | Когда |
|------------|-------|
| `.module.scss` + `@functions` | компонентные стили с fluid-размерами, миксинами |
| Tailwind | layout utilities, one-off spacing, быстрые правки |

Не дублировать одно и то же в Tailwind arbitrary values, если уже есть `adapt()` / `getJsClamp()`.

## Структура

```text
6_shared/
  styles/
    functions.scss      # adapt() + миксины, @use "@functions"
  lib/
    get-js-clamp.ts     # JS-аналог adapt() для inline styles
```

Layout-компоненты (`Stack`, `ContentGrid`) — см. [ui-mantine.md](./ui-mantine.md#layout-и-скролл-stack).
