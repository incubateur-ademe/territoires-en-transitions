import { z } from 'zod';

export const deleteDemarchePcaetInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
});

export type DeleteDemarchePcaetInput = z.infer<
  typeof deleteDemarchePcaetInputSchema
>;
