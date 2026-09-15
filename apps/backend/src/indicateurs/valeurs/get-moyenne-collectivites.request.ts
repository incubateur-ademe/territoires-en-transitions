import { indicateurPeriodiciteValues } from '@tet/domain/indicateurs';
import { z } from 'zod';

export const getMoyenneCollectivitesRequestSchema = z
  .object({
    periodicite: z.enum(indicateurPeriodiciteValues).optional(),
    collectiviteId: z.coerce
      .number()
      .int()
      .describe('Identifiant de la collectivité'),
    indicateurId: z.coerce
      .number()
      .int()
      .describe("Identifiant de l'indicateur"),
  })
  .describe(
    "Donne la moyenne par date d'un indicateur pour les collectivités de même type"
  );

export type GetMoyenneCollectivitesRequest = z.infer<
  typeof getMoyenneCollectivitesRequestSchema
>;
