import { z } from 'zod';

export const removeDemarchePcaetDocumentAdditionalInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
  documentAdditionalId: z.number().int().positive(),
});

export type RemoveDemarchePcaetDocumentAdditionalInput = z.infer<
  typeof removeDemarchePcaetDocumentAdditionalInputSchema
>;
