import { indicateurObjectifSchema } from '@tet/domain/indicateurs';
import * as z from 'zod/mini';

export const importObjectifSchema = z.object({
  ...z.omit(indicateurObjectifSchema, {
    indicateurId: true,
    dateValeur: true,
  }).shape,

  identifiantReferentiel: z.string(),
  // Les objectifs de référence sont des horizons annuels, indépendamment de
  // la périodicité des observations de l'indicateur. Toute date ISO valide
  // reste acceptée ; les graphiques la positionnent sur son année-horizon.
  dateValeur: z.iso.date(),
});

export type ImportObjectifType = z.infer<typeof importObjectifSchema>;
