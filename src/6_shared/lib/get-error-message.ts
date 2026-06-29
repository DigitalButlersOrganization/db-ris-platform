declare const errorMessageBrand: unique symbol;

/** Результат getErrorMessage — единственный допустимый аргумент для notify.error */
export type ErrorMessage = string & { readonly [errorMessageBrand]: true };

export const getErrorMessage = (error: unknown): ErrorMessage => {
	if (error instanceof Error) {
		return error.message as ErrorMessage;
	}

	return String(error) as ErrorMessage;
};
