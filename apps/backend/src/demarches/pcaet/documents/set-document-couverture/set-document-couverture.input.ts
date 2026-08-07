import { z } from 'zod';

export const setDemarchePcaetDocumentCouvertureInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
  documentId: z.string().trim().min(1),
  /** Déclare la pièce couverte sans document, ou retire la déclaration. */
  couvert: z.boolean(),
});

export type SetDemarchePcaetDocumentCouvertureInput = z.infer<
  typeof setDemarchePcaetDocumentCouvertureInputSchema
>;
