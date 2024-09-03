import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

export const deleteIndicateursValeursRequestSchema = extendApi(
  z
    .object({
      collectivite_id: z.coerce.number().int().openapi({
        description: 'Identifiant de la collectivité',
      }),
      indicateur_id: z.coerce.number().int().optional().openapi({
        description: "Identifiant de l'indicateur",
      }),
      metadonnee_id: z.coerce.number().int().optional().openapi({
        description:
          'Identifiant de la métadonnée permettant de sélectionner une source',
      }),
    })
    .openapi({
      title: 'Filtre de suppression des valeurs des indicateurs',
    }),
);
export type DeleteIndicateursValeursRequestType = z.infer<
  typeof deleteIndicateursValeursRequestSchema
>;

export const deleteIndicateursValeursResponseSchema = extendApi(
  z
    .object({
      indicateur_valeur_ids_supprimes: z.array(z.number().int()),
    })
    .openapi({
      title: 'Identifiant des valeurs supprimées',
    }),
);

export type DeleteIndicateursValeursResponseType = z.infer<
  typeof deleteIndicateursValeursResponseSchema
>;
