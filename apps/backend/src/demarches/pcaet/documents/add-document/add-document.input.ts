import { z } from 'zod';

export const addDemarchePcaetDocumentInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
  /** Identifiant de la pièce attendue (cf. modèle de démarche). */
  documentId: z.string().trim().min(1),
  /** Fichier de la bibliothèque de la collectivité à rattacher. */
  fichierId: z.number().int().positive(),
  commentaire: z.string().optional(),
});

export type AddDemarchePcaetDocumentInput = z.infer<
  typeof addDemarchePcaetDocumentInputSchema
>;
