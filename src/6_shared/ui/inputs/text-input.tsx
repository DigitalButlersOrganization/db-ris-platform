import {
	TextInput as MantineTextInput,
	type TextInputProps as MantineTextInputProps,
} from "@mantine/core";

import classes from "./inputs.module.scss";

export type TextInputProps = MantineTextInputProps;

export function TextInput(props: TextInputProps) {
	return (
		<MantineTextInput
			classNames={{
				label: classes.label,
				input: classes.input,
				error: classes.error,
				description: classes.description,
				required: classes.required,
			}}
			{...props}
		/>
	);
}
