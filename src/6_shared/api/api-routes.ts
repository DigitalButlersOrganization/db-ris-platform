export const BASE_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export const API_ROUTES = {
	PATIENT: {
		GET_LIST: "/patient/list",
		GET: "/patient/get",
		CREATE: "/patient/create",
		UPDATE: "/patient/update",
		DELETE: "/patient/delete",
	},
} as const;

export function apiRoute<
	E extends keyof typeof API_ROUTES,
	R extends keyof (typeof API_ROUTES)[E],
>(entity: E, route: R): string {
	return `${BASE_API_URL}${API_ROUTES[entity][route]}`;
}
