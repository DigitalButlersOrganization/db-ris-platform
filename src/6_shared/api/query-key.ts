export enum QUERY_KEY {
	PATIENT_LIST = "patient_list",
	PATIENT = "patient",
}

export function createQueryKey<T extends readonly unknown[]>(
	scope: QUERY_KEY,
	...rest: T
): readonly [QUERY_KEY, ...T] {
	return [scope, ...rest];
}

export const patientListQueryKey = (filters?: unknown) =>
	createQueryKey(QUERY_KEY.PATIENT_LIST, filters);

export const patientQueryKey = (id: string) =>
	createQueryKey(QUERY_KEY.PATIENT, id);
