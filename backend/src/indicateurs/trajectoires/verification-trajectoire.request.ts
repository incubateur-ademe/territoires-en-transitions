import { zodQueryBoolean } from '@/backend/utils/zod.utils';
import { z } from 'zod';
import { collectiviteRequestSchema } from '../../collectivites/collectivite.request';

export const verificationTrajectoireRequestSchema =
  collectiviteRequestSchema.extend({
    forceRecuperationDonnees: zodQueryBoolean
      .optional()
      .describe(
        'Récupère les données même si la trajectoire a déjà été calculée'
      ),
    epciInfo: zodQueryBoolean
      .optional()
      .describe("Retourne les informations de l'EPCI"),
    forceUtilisationDonneesCollectivite: zodQueryBoolean
      .optional()
      .describe(
        "Force l'utilisation des données de la collectivité plutôt que celles du rare"
      ),
  });
export type VerificationTrajectoireRequestType = z.infer<
  typeof verificationTrajectoireRequestSchema
>;
