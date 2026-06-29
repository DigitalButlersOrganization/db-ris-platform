import { CSSProperties, HTMLAttributes } from "react";

import classNames from "classnames";

import { getJsClamp } from "@shared/lib";

import classes from "./stack.module.scss";

interface StackProps extends HTMLAttributes<HTMLDivElement> {
	maw?: number;
	children: React.ReactNode;
	gap?: `${number}:${number}`;
	className?: string;
	style?: CSSProperties;
}

export const Stack = ({
	children,
	gap = "0:0",
	maw,
	className,
	style,
	...props
}: StackProps) => {
	const from = Number(gap.split(":")[0]);
	const to = Number(gap.split(":")[1]);
	const clamp = getJsClamp(from, to, 480, 1440);

	return (
		<div
			className={classNames(classes.root, className)}
			style={{ gap: clamp, maxWidth: maw || "auto", ...style }}
			{...props}
		>
			{children}
		</div>
	);
};
