import { z } from 'zod';

export const removeDemarchePcaetDocumentInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
  documentId: z.string().trim().min(1),
});

export type RemoveDemarchePcaetDocumentInput = z.infer<
  typeof removeDemarchePcaetDocumentInputSchema
>;
