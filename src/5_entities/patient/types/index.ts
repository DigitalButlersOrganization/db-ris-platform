import { z } from "zod";

export const patientSchema = z.object({
	id: z.string(),
	firstName: z.string(),
	lastName: z.string(),
});

export type Patient = z.infer<typeof patientSchema>;

export type GetPatientsResponse = Patient[];

export enum ADD_PATIENT_FIELDS {
	FIRST_NAME = "firstName",
	LAST_NAME = "lastName",
}

export const addPatientSchema = z.object({
	[ADD_PATIENT_FIELDS.FIRST_NAME]: z.string().min(1),
	[ADD_PATIENT_FIELDS.LAST_NAME]: z.string().min(1),
});

export type AddPatientValues = z.infer<typeof addPatientSchema>;
export type AddPatientPayload = AddPatientValues;

export type AddPatientResponse = Patient;
