import axios, { AxiosHeaders, type CreateAxiosDefaults } from "axios";

import {
	clearAuthToken,
	getAuthToken,
	isAuthTokenExpired,
	redirectToSignIn,
} from "@shared/lib";

import { BASE_API_URL } from "./api-routes";

export { apiRoute } from "./api-routes";

const baseRequestSettings: CreateAxiosDefaults = {
	baseURL: BASE_API_URL,
	headers: { "Content-Type": "application/json" },
};

const privateRequestSettings: CreateAxiosDefaults = {
	...baseRequestSettings,
};

const isSkip401Redirect = (headers: unknown): boolean => {
	if (headers instanceof AxiosHeaders) {
		return headers.get("x-skip-401-redirect") === "true";
	}

	return (headers as Record<string, string>)["x-skip-401-redirect"] === "true";
};

export const api = axios.create({
	...baseRequestSettings,
});

export const apiPrivate = axios.create({
	...privateRequestSettings,
});

apiPrivate.interceptors.request.use((config) => {
	if (typeof window !== "undefined" && config.headers) {
		const token = getAuthToken();

		if (token) {
			if (isAuthTokenExpired()) {
				clearAuthToken();

				const skip401Redirect = isSkip401Redirect(config.headers);

				if (!skip401Redirect) {
					redirectToSignIn();
				}

				return Promise.reject(new axios.CanceledError("Auth token expired"));
			}

			if (config.headers instanceof AxiosHeaders) {
				config.headers.set("Authorization", `Bearer ${token}`);
			} else {
				(config.headers as Record<string, string>).Authorization =
					`Bearer ${token}`;
			}
		}
	}

	if (config.data instanceof FormData && config.headers) {
		const headers = config.headers;

		if (headers instanceof AxiosHeaders) {
			headers.delete("Content-Type");
		} else {
			delete (headers as Record<string, unknown>)["Content-Type"];
			delete (headers as Record<string, unknown>)["content-type"];
		}
	}

	return config;
});

apiPrivate.interceptors.response.use(
	(response) => response,
	(error) => {
		const skip401Redirect = isSkip401Redirect(error.config?.headers);

		if (error.response?.status === 401) {
			if (typeof window !== "undefined") {
				clearAuthToken();
			}

			if (!skip401Redirect) {
				redirectToSignIn();
			}
		}

		return Promise.reject(error);
	},
);
