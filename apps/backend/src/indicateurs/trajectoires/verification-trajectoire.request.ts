import { zodQueryBoolean } from '@/backend/utils/zod.utils';
import { z } from 'zod';
import { collectiviteIdInputSchemaCoerce } from '../../collectivites/collectivite-id.input';

export const verificationTrajectoireRequestSchema = z.object({
  ...collectiviteIdInputSchemaCoerce.shape,
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
export type VerificationTrajectoireRequest = z.infer<
  typeof verificationTrajectoireRequestSchema
>;
