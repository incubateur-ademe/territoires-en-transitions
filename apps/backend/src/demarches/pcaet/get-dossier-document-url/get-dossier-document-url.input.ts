import { z } from 'zod';

export const getDossierDocumentUrlInputSchema = z.object({
  demandeAvisId: z.number().int().positive(),
  documentId: z.string().min(1),
});

export type GetDossierDocumentUrlInput = z.infer<
  typeof getDossierDocumentUrlInputSchema
>;
