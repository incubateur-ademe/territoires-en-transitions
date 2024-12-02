import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { collectiviteRequestSchema } from '../../collectivites/shared/models/collectivite.request';

export const verificationTrajectoireRequestSchema = extendApi(
  collectiviteRequestSchema.extend({
    forceRecuperationDonnees: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional()
      .describe(
        'Récupère les données même si la trajectoire a déjà été calculée'
      ),
    epciInfo: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional()
      .describe("Retourne les informations de l'EPCI"),
    forceUtilisationDonneesCollectivite: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional()
      .describe(
        "Force l'utilisation des données de la collectivité plutôt que celles du rare"
      ),
  })
);
export type VerificationTrajectoireRequestType = z.infer<
  typeof verificationTrajectoireRequestSchema
>;
