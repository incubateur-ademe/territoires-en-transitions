import { z } from 'zod';
import { indicateurObjectifSchema } from '../shared/models/indicateur-objectif.table';

export const importObjectifSchema = indicateurObjectifSchema
  .omit({
    indicateurId: true,
    dateValeur: true,
  })
  .extend({
    identifiantReferentiel: z.string(),
    dateValeur: z.iso.date(),
  });

export type ImportObjectifType = z.infer<typeof importObjectifSchema>;
