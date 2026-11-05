import { documentHashSchema } from '@tet/domain/collectivites';
import {
  PCAET_AVIS_PIECES_MAX,
  pcaetAvisAuTitreDeValues,
} from '@tet/domain/demarches';
import { z } from 'zod';

export const upsertAvisInputSchema = z.object({
  demandeAvisId: z.number().int().positive(),
  auTitreDe: z.enum(pcaetAvisAuTitreDeValues),
  /** Dans l'ordre du dépôt ; vide pour un brouillon sans pièce. */
  fichierRefs: z
    .array(documentHashSchema)
    .max(PCAET_AVIS_PIECES_MAX)
    .transform((refs) => [...new Set(refs)]),
});

export type UpsertAvisInput = z.infer<typeof upsertAvisInputSchema>;
