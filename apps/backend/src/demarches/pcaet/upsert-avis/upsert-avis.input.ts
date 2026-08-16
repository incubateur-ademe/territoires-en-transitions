import {
  pcaetAvisAuTitreDeValues,
  pcaetAvisSensValues,
} from '@tet/domain/demarches';
import { z } from 'zod';

export const upsertAvisInputSchema = z.object({
  demandeAvisId: z.number().int().positive(),
  auTitreDe: z.enum(pcaetAvisAuTitreDeValues),
  sens: z.enum(pcaetAvisSensValues),
  fichierRef: z.string().min(1).nullable(),
});

export type UpsertAvisInput = z.infer<typeof upsertAvisInputSchema>;
