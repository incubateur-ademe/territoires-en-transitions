import { demarcheDocumentEtapeValues } from '@tet/domain/demarches';
import { z } from 'zod';

/**
 * Ouverture d'une pièce additionnelle : ni titre ni fichier. La ligne apparaît d'abord,
 * la collectivité la nomme et y dépose dans l'ordre qu'elle veut (cf.
 * `updateAdditional`). L'étape dit à quelle partie du dossier la pièce se rattache —
 * et donc à quels statuts elle reste modifiable.
 */
export const createDemarchePcaetDocumentAdditionalInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
  etape: z.enum(demarcheDocumentEtapeValues),
});

export type CreateDemarchePcaetDocumentAdditionalInput = z.infer<
  typeof createDemarchePcaetDocumentAdditionalInputSchema
>;
