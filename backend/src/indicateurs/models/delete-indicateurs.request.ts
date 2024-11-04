import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

export const deleteIndicateursValeursRequestSchema = extendApi(
  z
    .object({
      collectiviteId: z.coerce.number().int().openapi({
        description: 'Identifiant de la collectivité',
      }),
      indicateurId: z.coerce.number().int().optional().openapi({
        description: "Identifiant de l'indicateur",
      }),
      metadonneeId: z.coerce.number().int().optional().openapi({
        description:
          'Identifiant de la métadonnée permettant de sélectionner une source',
      }),
    })
    .openapi({
      title: 'Filtre de suppression des valeurs des indicateurs',
    })
);
export type DeleteIndicateursValeursRequestType = z.infer<
  typeof deleteIndicateursValeursRequestSchema
>;