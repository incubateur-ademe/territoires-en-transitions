import { DEMARCHE_DOCUMENT_ADDITIONAL_TITRE_MAX } from '@tet/domain/demarches';
import { z } from 'zod';

/**
 * Nommage d'une pièce additionnelle et/ou dépôt du fichier. Une seule route pour les
 * deux, comme `add` sert de « remplacer » pour les pièces du catalogue. Un titre
 * vide est recevable : il rend son anonymat à la pièce, qui s'affiche alors sans
 * nom défini.
 */
export const updateDemarchePcaetDocumentAdditionalInputSchema = z
  .object({
    collectiviteId: z.number().int().positive(),
    demarcheId: z.number().int().positive(),
    documentAdditionalId: z.number().int().positive(),
    titre: z
      .string()
      .trim()
      .max(DEMARCHE_DOCUMENT_ADDITIONAL_TITRE_MAX)
      .optional(),
    /** Fichier de la bibliothèque de la collectivité à rattacher. */
    fichierId: z.number().int().positive().optional(),
  })
  .refine(
    ({ titre, fichierId }) => titre !== undefined || fichierId !== undefined,
    { message: 'Rien à modifier : précisez un titre ou un fichier' }
  );

export type UpdateDemarchePcaetDocumentAdditionalInput = z.infer<
  typeof updateDemarchePcaetDocumentAdditionalInputSchema
>;
