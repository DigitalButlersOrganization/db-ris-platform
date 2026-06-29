"use client";

import { Notifications } from "@mantine/notifications";

import styles from "./app-notifications.module.css";

import "@mantine/notifications/styles.css";

export function AppNotifications() {
	return (
		<Notifications
			classNames={{
				root: styles.root,
				notification: styles.notification,
			}}
			position="top-right"
			zIndex={999_999}
			limit={5}
			containerWidth={200}
			portalProps={{
				style: {
					position: "fixed",
					right: "20px",
					top: "20px",
					zIndex: 999_999,
				},
			}}
		/>
	);
}
