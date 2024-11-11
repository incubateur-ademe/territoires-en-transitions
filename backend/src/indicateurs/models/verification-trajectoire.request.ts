import { extendApi, extendZodWithOpenApi } from "@anatine/zod-openapi";
import { z } from 'zod';
import { collectiviteRequestSchema } from "../../collectivites/models/collectivite.request";

extendZodWithOpenApi(z);

export const verificationTrajectoireRequestSchema = extendApi(
    collectiviteRequestSchema.extend({
      forceRecuperationDonnees: z
        .enum(['true', 'false'])
        .transform((value) => value === 'true')
        .optional()
        .openapi({
          description:
            'Récupère les données même si la trajectoire a déjà été calculée',
        }),
      epciInfo: z
        .enum(['true', 'false'])
        .transform((value) => value === 'true')
        .optional()
        .openapi({
          description: "Retourne les informations de l'EPCI",
        }),
      forceUtilisationDonneesCollectivite: z
        .enum(['true', 'false'])
        .transform((value) => value === 'true')
        .optional()
        .openapi({
          description:
            "Force l'utilisation des données de la collectivité plutôt que celles du rare",
        }),
    })
  );
  export type VerificationTrajectoireRequestType = z.infer<
    typeof verificationTrajectoireRequestSchema
  >;