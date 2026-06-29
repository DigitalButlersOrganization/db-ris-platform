"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiPrivate, apiRoute, patientListQueryKey } from "@shared/api";

import type {
	AddPatientPayload,
	AddPatientResponse,
} from "./types";

export function useCreatePatient() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (payload: AddPatientPayload) =>
			apiPrivate
				.post<AddPatientResponse>(apiRoute("PATIENT", "CREATE"), payload)
				.then((response) => response.data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: patientListQueryKey() });
		},
	});
}
