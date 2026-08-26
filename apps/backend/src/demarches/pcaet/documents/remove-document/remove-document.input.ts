import { demarcheDocumentEtapeValues } from '@tet/domain/demarches';
import { z } from 'zod';

export const removeDemarchePcaetDocumentInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
  documentId: z.string().trim().min(1),
  /**
   * Version à retirer. Facultatif : sans précision, celle du temps où la pièce
   * est exigée — retirer une reprise aval ne touche pas la version transmise.
   */
  etape: z.enum(demarcheDocumentEtapeValues).optional(),
});

export type RemoveDemarchePcaetDocumentInput = z.infer<
  typeof removeDemarchePcaetDocumentInputSchema
>;
