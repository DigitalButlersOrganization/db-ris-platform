import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

import { getErrorMessage, notify } from "@shared/lib";

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error) => {
			notify.error(getErrorMessage(error));
		},
	}),
	mutationCache: new MutationCache({
		onError: (error) => {
			notify.error(getErrorMessage(error));
		},
	}),
	defaultOptions: {
		queries: {
			staleTime: 30_000,
			retry: 1,
			refetchOnWindowFocus: false,
		},
	},
});
