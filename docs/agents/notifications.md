# Notifications

Централизованные toast-уведомления на базе `@mantine/notifications`.

## Архитектура

```
providers.tsx
  └── <AppNotifications />     ← @shared/ui (контейнер + стили + дефолты)

query-client.ts
  └── QueryCache / MutationCache onError → notify.error(getErrorMessage(error))

features / entities / pages
  └── notify.success(...)        ← только для значимых мутаций
  └── notify.error(...)        ← только вне query/mutation (редко; ошибки API — глобально)
```

| Слой | Файл | Роль |
|------|------|------|
| UI | `6_shared/ui/notifications/app-notifications.tsx` | `<Notifications />` с дефолтами и classNames |
| Lib | `6_shared/lib/notify.ts` | Императивный API `notify.success` / `notify.error` |
| Lib | `6_shared/lib/get-error-message.ts` | Нормализация ошибок + branded type `ErrorMessage` |
| API | `6_shared/api/query-client.ts` | Глобальный `onError` для queries и mutations |

## Импорты

```ts
import { notify, getErrorMessage } from "@shared/lib";
import { AppNotifications } from "@shared/ui"; // только в providers.tsx
```

**Запрещено** в прикладном коде:

```ts
import { notifications } from "@mantine/notifications"; // ❌
notifications.show({ ... }); // ❌
```

## API

### `notify.success(message, title?)`

```ts
notify.success("Врач назначен");
notify.success("Пациент создан", "Готово"); // кастомный title
```

- `title` по умолчанию: `"Success"`
- `autoClose`: 3000 ms
- `withCloseButton`: false

### `notify.error(message, title?)`

```ts
notify.error(getErrorMessage(error));
```

- Аргумент **только** `ErrorMessage` (результат `getErrorMessage`)
- Произвольная строка — ошибка TypeScript
- `title` по умолчанию: `"Error"`

### `getErrorMessage(error: unknown): ErrorMessage`

Единая точка нормализации ошибок. Сейчас — базовая реализация (`Error.message` / `String(error)`).

В будущем сюда добавляется разбор `AxiosError`, `response.data.message`, fallback-тексты. Сигнатура `notify.error` не меняется.

## Providers

```tsx
// src/app/providers.tsx
<MantineProvider>
  {children}
  <AppNotifications />
</MantineProvider>
```

CSS `@mantine/notifications/styles.css` импортируется внутри `AppNotifications`.

## Глобальные ошибки (TanStack Query)

В `query-client.ts` настроены `QueryCache` и `MutationCache` с `onError`:

```ts
queryCache: new QueryCache({
  onError: (error) => notify.error(getErrorMessage(error)),
}),
mutationCache: new MutationCache({
  onError: (error) => notify.error(getErrorMessage(error)),
}),
```

**Правило для агентов:** не дублировать `notify.error` в `onError` хуков — ошибки API показываются автоматически.

В хуках остаётся:

- `onSuccess` → `notify.success(...)` где уместно
- `queryClient.invalidateQueries(...)` в `onSuccess`

## Когда показывать

### Ошибки — всегда (глобально)

Любой failed query или mutation → toast через `queryClient`. Дополнительно на экране — `ErrorState` (см. [coding-conventions.md](./coding-conventions.md)).

### Success — только значимые мутации

| Показываем | Не показываем |
|------------|---------------|
| Создали / удалили / изменили сущность | Применили фильтр к списку |
| Назначили врача, сменили статус | Успешный GET / refetch |
| Оплата прошла, заключение отправлено | Переключили таб / сортировку |

```ts
// use-assign-doctor.ts
return useMutation({
  mutationFn: ...,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: appointmentListQueryKey() });
    notify.success("Врач назначен");
  },
  // onError не нужен — глобальный handler
});
```

```ts
// use-get-appointment-list.ts — success toast не нужен
return useQuery({
  queryKey: appointmentListQueryKey(filters),
  queryFn: ...,
});
```

## Примеры домена

| Действие | Success toast |
|----------|---------------|
| `useCreatePatient` | ✅ «Пациент создан» |
| `useChangeAppointmentStatus` | ✅ «Статус обновлён» |
| `useAssignDoctor` | ✅ «Врач назначен» |
| `useSubmitVerdict` | ✅ «Заключение сохранено» |
| Фильтр очереди ресепшена | ❌ |
| Смена сортировки списка | ❌ |

## ESLint

`@mantine/notifications` разрешён только в:

- `src/6_shared/ui/**`
- `src/6_shared/lib/notify.ts`

В остальном коде — `notify` из `@shared/lib`.
