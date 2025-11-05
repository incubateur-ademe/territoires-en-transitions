import { indicateurObjectifSchema } from '@/domain/indicateurs';
import * as z from 'zod/mini';

export const importObjectifSchema = z.object({
  ...z.omit(indicateurObjectifSchema, {
    indicateurId: true,
    dateValeur: true,
  }).shape,

  identifiantReferentiel: z.string(),
  dateValeur: z.iso.date(),
});

export type ImportObjectifType = z.infer<typeof importObjectifSchema>;
