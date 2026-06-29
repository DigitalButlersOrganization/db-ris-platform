export function getAuthToken(): string | null {
	if (typeof window === "undefined") {
		return null;
	}

	return localStorage.getItem("auth_token");
}

export function isAuthTokenExpired(): boolean {
	return false;
}

export function clearAuthToken(): void {
	if (typeof window === "undefined") {
		return;
	}

	localStorage.removeItem("auth_token");
}

export function redirectToSignIn(): void {
	if (typeof window === "undefined") {
		return;
	}

	window.location.assign("/login");
}
