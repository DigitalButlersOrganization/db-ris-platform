import type { ReactNode } from "react";
import { Box, BoxProps, ScrollArea } from "@mantine/core";
import styles from "./content-grid.module.css";

const ContentGridHeader = ({ children }: { children: ReactNode }) => {
	return <div className={styles.header}>{children}</div>;
};

type ContentGridBodyProps = {
	children: ReactNode;
};

const ContentGridBody = ({ children }: ContentGridBodyProps) => {
	return (
		<div className={styles.bodyScrollable}>
			<ScrollArea
				classNames={{
					root: styles.scroller,
					viewport: styles.scrollerViewport,
					scrollbar: styles.scrollerScrollbar,
				}}
				h="100%"
				scrollbars="y"
				scrollbarSize={4}
				type="auto"
			>
				{children}
			</ScrollArea>
		</div>
	);
};

const ContentGridFooter = ({ children }: { children: ReactNode }) => {
	return <div className={styles.footer}>{children}</div>;
};

type ContentGridProps = BoxProps & {
	children?: ReactNode;
};

export function ContentGrid({ children, ...props }: ContentGridProps) {
	return (
		<Box className={styles.root} {...props}>
			{children}
		</Box>
	);
}

ContentGrid.Header = ContentGridHeader;
ContentGrid.Body = ContentGridBody;
ContentGrid.Footer = ContentGridFooter;
