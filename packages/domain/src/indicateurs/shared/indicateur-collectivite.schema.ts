import * as z from 'zod/mini';
import { indicateurPeriodiciteSchema } from '../definitions/indicateur-periodicite.schema';

export const indicateurCollectiviteSchema = z.object({
  collectiviteId: z.number(),
  indicateurId: z.number(),
  periodicite: z.nullable(indicateurPeriodiciteSchema),
  commentaire: z.nullable(z.string()),
  confidentiel: z.boolean(),
  favoris: z.boolean(),
  modifiedBy: z.nullable(z.uuid()),
  modifiedAt: z.string(),
});

export type IndicateurCollectivite = z.infer<
  typeof indicateurCollectiviteSchema
>;
