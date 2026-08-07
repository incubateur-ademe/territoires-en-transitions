import { z } from 'zod';

export const listDemarchePcaetDocumentsInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
});

export type ListDemarchePcaetDocumentsInput = z.infer<
  typeof listDemarchePcaetDocumentsInputSchema
>;
