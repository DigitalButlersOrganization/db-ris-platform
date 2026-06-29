# Типы и Zod

Конвенции типизации сущностей, форм и API-контрактов.

## Принцип

**Zod-схема — source of truth.** TypeScript-типы выводим через `z.infer`, не дублируем руками.

```ts
export const patientSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
});

export type Patient = z.infer<typeof patientSchema>;
```

Runtime-валидация (`.parse()` / `.safeParse()`) — для форм обязательна, для каждого API-response — нет. Типы из Zod используем везде; парсить ответ сервера точечно, только если endpoint критичный или контракт нестабилен.

## Где хранить

Все типы и схемы сущности — в одном месте:

```text
src/5_entities/{entity}/types/index.ts
```

Пример: `src/5_entities/patients/types/index.ts`

Вне entity-слайса типы сущности не объявляем. Импорт: `@entities/patients` (через public API `index.ts`).

## Именование

| Суффикс / паттерн | Назначение | Пример |
|-------------------|------------|--------|
| `*Schema` | Zod-схема | `patientSchema`, `addPatientSchema` |
| `*_FIELDS` | string enum ключей полей формы | `ADD_PATIENT_FIELDS` |
| `*Values` | данные формы / UI | `AddPatientValues` |
| `*Payload` | тело запроса на backend | `AddPatientPayload` |
| `*Response` | ответ конкретного endpoint | `GetPatientsResponse` |
| без суффикса | доменная сущность / DTO | `Patient` |

Типы — `PascalCase`. Enum полей формы — `UPPER_SNAKE_CASE` с суффиксом `_FIELDS`.

## Поля формы — enum

Ключи полей выносим в **string enum**, чтобы менять имя поля в одном месте:

```ts
export enum ADD_PATIENT_FIELDS {
  FIRST_NAME = "firstName",
  LAST_NAME = "lastName",
}
```

Используем enum в Zod-схеме, Mantine Form, `form.getInputProps`, тестах:

```ts
export const addPatientSchema = z.object({
  [ADD_PATIENT_FIELDS.FIRST_NAME]: z.string().min(1),
  [ADD_PATIENT_FIELDS.LAST_NAME]: z.string().min(1),
});

export type AddPatientValues = z.infer<typeof addPatientSchema>;
```

Только **string enum**, не numeric.

## Values и Payload

Для отправки данных на сервер всегда разделяем:

- `*Values` — что собирает форма
- `*Payload` — что уходит в HTTP body

Даже если структуры совпадают:

```ts
export type AddPatientPayload = AddPatientValues;
```

Если payload шире (utm, source, id сущности и т.д.):

```ts
export type AddPatientPayload = AddPatientValues & {
  source: "registration";
};

export function mapAddPatientValuesToPayload(
  values: AddPatientValues,
): AddPatientPayload {
  return {
    ...values,
    source: "registration",
  };
}
```

Mutation-хук принимает `Values`, внутри маппит в `Payload` при необходимости.

## Ответы API (GET и др.)

Схема и тип на endpoint, не общий «размытый» тип:

```ts
export const getPatientsResponseSchema = z.array(patientSchema);

export type GetPatientsResponse = z.infer<typeof getPatientsResponseSchema>;
```

В query-хуке:

```ts
apiPrivate
  .get<GetPatientsResponse>(apiRoute("PATIENT", "GET_LIST"))
  .then((response) => response.data);
```

Опционально, для критичных ответов:

```ts
.then((response) => getPatientsResponseSchema.parse(response.data));
```

## Пример `types/index.ts`

```ts
import { z } from "zod";

// --- entity ---

export const patientSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
});

export type Patient = z.infer<typeof patientSchema>;

export const getPatientsResponseSchema = z.array(patientSchema);

export type GetPatientsResponse = z.infer<typeof getPatientsResponseSchema>;

// --- form: add patient ---

export enum ADD_PATIENT_FIELDS {
  FIRST_NAME = "firstName",
  LAST_NAME = "lastName",
}

export const addPatientSchema = z.object({
  [ADD_PATIENT_FIELDS.FIRST_NAME]: z.string().min(1),
  [ADD_PATIENT_FIELDS.LAST_NAME]: z.string().min(1),
});

export type AddPatientValues = z.infer<typeof addPatientSchema>;
export type AddPatientPayload = AddPatientValues;

export type AddPatientResponse = Patient;
```

## Связь с другими слоями

| Слой | Что берёт из `types/` |
|------|------------------------|
| `5_entities/{entity}/use-*.ts` | `*Response`, `*Payload`, `*Values` |
| `features/*` (формы) | `*Schema`, `*_FIELDS`, `*Values` |
| `6_shared/api/` | не хранит доменные типы |

## Запрещено

```ts
// ❌ дублировать тип руками, когда есть схема
type Patient = { id: string; firstName: string };

// ❌ объявлять типы сущности в features/widgets/pages
type AddPatientPayload = { ... };

// ❌ inline string-ключи полей формы по всему UI
<TextInput name="firstName" />

// ✅
<TextInput {...form.getInputProps(ADD_PATIENT_FIELDS.FIRST_NAME)} />
```
