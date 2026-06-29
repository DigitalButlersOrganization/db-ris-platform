"use client";

import { useQuery } from "@tanstack/react-query";

import { apiPrivate, apiRoute, patientListQueryKey } from "@shared/api";

import type { GetPatientsResponse } from "./types";

export function useGetPatientList() {
	return useQuery({
		queryKey: patientListQueryKey(),
		queryFn: () =>
			apiPrivate
				.get<GetPatientsResponse>(apiRoute("PATIENT", "GET_LIST"))
				.then((response) => response.data),
	});
}
