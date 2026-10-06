import { annualReleasePeriodiciteSchema } from '../definitions/indicateur-annual-release.input';
import { z } from 'zod';

export const getMoyenneCollectivitesRequestSchema = z
  .object({
    periodicite: z.optional(annualReleasePeriodiciteSchema),
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
