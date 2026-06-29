import { notifications } from "@mantine/notifications";

import type { ErrorMessage } from "./get-error-message";

const DEFAULT_AUTO_CLOSE = 3000;

export const notify = {
	success(message: string, title = "Success") {
		notifications.show({
			title,
			message,
			color: "green",
			autoClose: DEFAULT_AUTO_CLOSE,
			withCloseButton: false,
		});
	},

	error(message: ErrorMessage, title = "Error") {
		notifications.show({
			title,
			message,
			color: "red",
			autoClose: DEFAULT_AUTO_CLOSE,
			withCloseButton: false,
		});
	},
} as const;
