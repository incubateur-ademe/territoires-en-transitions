import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

export const deleteIndicateursValeursRequestSchema = extendApi(
  z
    .object({
      collectiviteId: z.coerce
        .number()
        .int()
        .describe('Identifiant de la collectivité'),
      indicateurId: z.coerce
        .number()
        .int()
        .optional()
        .describe("Identifiant de l'indicateur"),
      metadonneeId: z.coerce
        .number()
        .int()
        .optional()
        .describe(
          'Identifiant de la métadonnée permettant de sélectionner une source'
        ),
    })
    .describe('Filtre de suppression des valeurs des indicateurs')
);
export type DeleteIndicateursValeursRequestType = z.infer<
  typeof deleteIndicateursValeursRequestSchema
>;
