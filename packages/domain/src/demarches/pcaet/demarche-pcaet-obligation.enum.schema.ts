import * as z from 'zod/mini';

export const DemarchePcaetObligationEnum = {
  VOLONTAIRE: 'volontaire',
  OBLIGATOIRE: 'obligatoire',
} as const;

export const demarchePcaetObligationValues = [
  DemarchePcaetObligationEnum.VOLONTAIRE,
  DemarchePcaetObligationEnum.OBLIGATOIRE,
] as const;

export const demarchePcaetObligationSchema = z.enum(
  demarchePcaetObligationValues
);

export type DemarchePcaetObligation = z.infer<
  typeof demarchePcaetObligationSchema
>;
