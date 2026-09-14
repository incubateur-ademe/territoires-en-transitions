import { documentHashSchema } from '@tet/domain/collectivites';
import { pcaetAvisAuTitreDeValues } from '@tet/domain/demarches';
import { z } from 'zod';

export const upsertAvisInputSchema = z.object({
  demandeAvisId: z.number().int().positive(),
  auTitreDe: z.enum(pcaetAvisAuTitreDeValues),
  fichierRef: documentHashSchema.nullable(),
});

export type UpsertAvisInput = z.infer<typeof upsertAvisInputSchema>;
