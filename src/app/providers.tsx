"use client";

import { MantineProvider } from "@mantine/core";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "@shared/api";
import { AppNotifications } from "@shared/ui";

import "@mantine/core/styles.css";

export function Providers({ children }: { children: React.ReactNode }) {
	return (
		<QueryClientProvider client={queryClient}>
			<MantineProvider>
				{children}
				<AppNotifications />
			</MantineProvider>
		</QueryClientProvider>
	);
}
