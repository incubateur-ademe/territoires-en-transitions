import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { categorieSchema } from '@tet/api/indicateurs/domain';
import { createZodDto } from '@anatine/zod-nestjs';
import { getQueryOptionsSchema } from '@tet/api/shared/domain';

export const getFilteredIndicateursRequestOptionsSchema = extendApi(
  z
    .object({
      actionId: z.string().optional().openapi({
        description:
          "Identifiant de l'action du référentiel. (ex : cae_2.1) permettant de récupérer les indicateurs qui lui sont lié.",
      }),
      participationScore: z
        .boolean()
        .optional()
        .openapi({
          description:
            'Vrai pour ne récupérer que les indicateurs participant au score, directement (ou via un de leurs enfants si avecEnfants!=true). \n' +
            'Faux ou non renseigné pour ne pas appliquer de filtre.',
        }),
      estComplet: z.coerce
        .boolean()
        .default(false)
        .optional()
        .openapi({
          description:
            'Vrai pour ne retourner que les indicateurs ayant des valeurs utilisateur (ou dont tous les enfants en possède si avecEnfants!=true). \n' +
            "Faux pour ne retourner que les indicateurs sans valeurs utilisateurs (ou dont au moins un enfant n'en possède pas si avecEnfants!=true). \n" +
            'Non renseigné pour ne pas appliquer de filtre.',
        }),
      estConfidentiel: z.coerce
        .boolean()
        .default(false)
        .optional()
        .openapi({
          description:
            'Vrai pour ne récupérer que les indicateurs confidentiels (ou dont un enfant est confidentiel si avecEnfants!=true). \n' +
            'Faux ou non renseigné pour ne pas appliquer de filtre.',
        }),
      estFavorisCollectivite: z.coerce
        .boolean()
        .default(false)
        .optional()
        .openapi({
          description:
            'Vrai pour ne récupérer que les indicateurs favoris (ou dont un enfant est favoris si avecEnfants!=true). \n' +
            'Faux ou non renseigné pour ne pas appliquer de filtre.',
        }),
      fichesNonClassees: z.coerce
        .boolean()
        .default(false)
        .optional()
        .openapi({
          description:
            'Vrai pour ne récupérer que les indicateurs ayant au moins une fiche sans plan liée (ou dont un enfant en possède au moins une si avecEnfants!=true). \n' +
            'Faux ou non renseigné pour ne pas appliquer de filtre.',
        }),
      text: z
        .string()
        .optional()
        .openapi({
          description:
            'Recherche sur la description ou le titre des indicateurs.' +
            "Permet de rechercher un indicateur parent ou enfant par son identifiant référentiel avec un # devant (ex: '#cae_2.a')",
        }),
      estPerso: z.coerce
        .boolean()
        .default(false)
        .optional()
        .openapi({
          description:
            'Vrai pour ne récupérer que les indicateurs personnalisés (propre à la collectivité). \n' +
            'Faux ou non renseigné pour ne pas appliquer de filtre.',
        }),
      categorieNoms: z.array(categorieSchema.shape.nom).optional().openapi({
        description:
          'Liste de nom de catégories permettant de récupérer les indicateurs ayant une de ces catégories (ou dont un enfant en possède une si avecEnfants!=true).',
      }),
      hasOpenData: z.coerce
        .boolean()
        .optional()
        .openapi({
          description:
            'Vrai pour ne récupérer que les indicateurs confidentiels (ou dont un enfant est confidentiel si avecEnfants!=true). \n' +
            'Faux ou non renseigné pour ne pas appliquer de filtre.',
        }),
      thematiqueIds: z.coerce.number().array().optional().openapi({
        description:
          'Liste des identifiants de thématiques permettant de récupérer les indicateurs ayant une de ces thématiques (ou dont un enfant en possède une si avecEnfants!=true).',
      }),
      planActionIds: z.coerce.number().array().optional().openapi({
        description:
          "Liste des identifiants de plans d'action permettant de récupérer les indicateurs liés à une des fiche d'un de ces plans (ou dont un enfant en est lié si avecEnfants!=true).",
      }),
      utilisateurPiloteIds: z.string().array().optional().openapi({
        description:
          "Liste des identifiants des utilisateurs pilotes permettant de récupérer les indicateurs pilotés par un d'eux (ou dont un enfant l'est si avecEnfants!=true).",
      }),
      personnePiloteIds: z.coerce.number().array().optional().openapi({
        description:
          "Liste des identifiants des tags pilotes permettant de récupérer les indicateurs pilotés par un d'eux (ou dont un enfant l'est si avecEnfants!=true).",
      }),
      servicePiloteIds: z.coerce.number().array().optional().openapi({
        description:
          "Liste des identifiants des services pilotes permettant de récupérer les indicateurs pilotés par un d'eux (ou dont un enfant l'est si avecEnfants!=true).",
      }),
      ficheActionIds: z.number().array().optional().openapi({
        description:
          "Liste des identifiants des fiches action permettant de récupérer les indicateurs liés à l'une d'elle (ou dont un enfant en est lié si avecEnfants!=true).",
      }),
      avecEnfants: z
        .boolean()
        .optional()
        .openapi({
          description:
            'Faux ou non renseigné pour ne récupérer que les parents. \n' +
            'Vrai pour ne récupérer que les indicateurs directement ciblés par les filtres, parents ou enfants. \n' +
            "Ignore ce filtre si le filtre 'text' recherche sur un #identifiant.",
        }),
    })
    .openapi({
      title: 'Options pour filtrer les indicateurs.',
    })
);

export type GetFilteredIndicateursRequestOptionType = z.infer<
  typeof getFilteredIndicateursRequestOptionsSchema
>;

export const getFilteredIndicateurRequestQueryOptionSchema = extendApi(
  getQueryOptionsSchema(['text', 'estComplet'])
);

export type GetFilteredIndicateurRequestQueryOptionType = z.infer<
  typeof getFilteredIndicateurRequestQueryOptionSchema
>;

export const getFilteredIndicateursRequestSchema = extendApi(
  z.object({
    collectiviteId: z.number().openapi({
      description: 'Identifiant de la collectivité.',
    }),
    filtre: extendApi(getFilteredIndicateursRequestOptionsSchema),
    queryOptions: extendApi(getFilteredIndicateurRequestQueryOptionSchema),
  })
);

export class GetFilteredIndicateursRequestClass extends createZodDto(
  getFilteredIndicateursRequestSchema
) {}
