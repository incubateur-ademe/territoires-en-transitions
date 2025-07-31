import { getPaginationSchema } from '@/backend/utils/pagination.schema';
import { z } from 'zod';
import { LIMIT_DEFAULT, PAGE_DEFAULT } from '../../utils/pagination.schema';

export const listIndicateursRequestFiltersSchema = z.object({
  actionId: z
    .string()
    .optional()
    .describe(
      "Identifiant de l'action du référentiel. (ex : cae_2.1) permettant de récupérer les indicateurs qui lui sont lié."
    ),
  participationScore: z
    .boolean()
    .optional()
    .describe(
      'Vrai pour ne récupérer que les indicateurs participant au score, directement (ou via un de leurs enfants si avecEnfants!=true). \n' +
        'Faux ou non renseigné pour ne pas appliquer de filtre.'
    ),
  estComplet: z.coerce
    .boolean()
    .default(false)
    .optional()
    .describe(
      'Vrai pour ne retourner que les indicateurs ayant des valeurs utilisateur (ou dont tous les enfants en possède si avecEnfants!=true). \n' +
        "Faux pour ne retourner que les indicateurs sans valeurs utilisateurs (ou dont au moins un enfant n'en possède pas si avecEnfants!=true). \n" +
        'Non renseigné pour ne pas appliquer de filtre.'
    ),
  estConfidentiel: z.coerce
    .boolean()
    .default(false)
    .optional()
    .describe(
      'Vrai pour ne récupérer que les indicateurs confidentiels (ou dont un enfant est confidentiel si avecEnfants!=true). \n' +
        'Faux ou non renseigné pour ne pas appliquer de filtre.'
    ),
  estFavorisCollectivite: z.coerce
    .boolean()
    .default(false)
    .optional()
    .describe(
      'Vrai pour ne récupérer que les indicateurs favoris (ou dont un enfant est favoris si avecEnfants!=true). \n' +
        'Faux ou non renseigné pour ne pas appliquer de filtre.'
    ),
  fichesNonClassees: z.coerce
    .boolean()
    .default(false)
    .optional()
    .describe(
      'Vrai pour ne récupérer que les indicateurs ayant au moins une fiche sans plan liée (ou dont un enfant en possède au moins une si avecEnfants!=true). \n' +
        'Faux ou non renseigné pour ne pas appliquer de filtre.'
    ),
  text: z
    .string()
    .optional()
    .describe(
      'Recherche sur la description ou le titre des indicateurs.' +
        "Permet de rechercher un indicateur parent ou enfant par son identifiant référentiel avec un # devant (ex: '#cae_2.a')"
    ),
  estPerso: z.coerce
    .boolean()
    .default(false)
    .optional()
    .describe(
      'Vrai pour ne récupérer que les indicateurs personnalisés (propre à la collectivité). \n' +
        'Faux ou non renseigné pour ne pas appliquer de filtre.'
    ),
  categorieNoms: z
    .string()
    .array()
    .optional()
    .describe(
      'Liste de nom de catégories permettant de récupérer les indicateurs ayant une de ces catégories (ou dont un enfant en possède une si avecEnfants!=true).'
    ),
  hasOpenData: z.coerce
    .boolean()
    .optional()
    .describe(
      'Vrai pour ne récupérer que les indicateurs confidentiels (ou dont un enfant est confidentiel si avecEnfants!=true). \n' +
        'Faux ou non renseigné pour ne pas appliquer de filtre.'
    ),
  thematiqueIds: z.coerce
    .number()
    .array()
    .optional()
    .describe(
      'Liste des identifiants de thématiques permettant de récupérer les indicateurs ayant une de ces thématiques (ou dont un enfant en possède une si avecEnfants!=true).'
    ),
  planActionIds: z.coerce
    .number()
    .array()
    .optional()
    .describe(
      "Liste des identifiants de plans d'action permettant de récupérer les indicateurs liés à une des fiche d'un de ces plans (ou dont un enfant en est lié si avecEnfants!=true)."
    ),
  utilisateurPiloteIds: z
    .string()
    .array()
    .optional()
    .describe(
      "Liste des identifiants des utilisateurs pilotes permettant de récupérer les indicateurs pilotés par un d'eux (ou dont un enfant l'est si avecEnfants!=true)."
    ),
  personnePiloteIds: z.coerce
    .number()
    .array()
    .optional()
    .describe(
      "Liste des identifiants des tags pilotes permettant de récupérer les indicateurs pilotés par un d'eux (ou dont un enfant l'est si avecEnfants!=true)."
    ),
  servicePiloteIds: z.coerce
    .number()
    .array()
    .optional()
    .describe(
      "Liste des identifiants des services pilotes permettant de récupérer les indicateurs pilotés par un d'eux (ou dont un enfant l'est si avecEnfants!=true)."
    ),
  ficheActionIds: z
    .number()
    .array()
    .optional()
    .describe(
      "Liste des identifiants des fiches action permettant de récupérer les indicateurs liés à l'une d'elle (ou dont un enfant en est lié si avecEnfants!=true)."
    ),
  withChildren: z
    .boolean()
    .optional()
    .describe(
      'Faux ou non renseigné pour ne récupérer que les parents. \n' +
        'Vrai pour ne récupérer que les indicateurs directement ciblés par les filtres, parents ou enfants. \n' +
        "Ignore ce filtre si le filtre 'text' recherche sur un #identifiant ou si le filtre indicateurIds n'est pas vide."
    ),
  indicateurIds: z
    .number()
    .array()
    .optional()
    .describe('Liste des identifiants des indicateurs à récupérer.'),
});

export type ListIndicateursRequestFilters = z.infer<
  typeof listIndicateursRequestFiltersSchema
>;

export const listIndicateurRequestQueryOptionsSchema = getPaginationSchema([
  'text',
  'estComplet',
]);

export type ListIndicateurRequestQueryOptions = z.infer<
  typeof listIndicateurRequestQueryOptionsSchema
>;

export const listIndicateursRequestSchema = z.object({
  collectiviteId: z.number().describe('Identifiant de la collectivité.'),
  filtre: listIndicateursRequestFiltersSchema,
  queryOptions: listIndicateurRequestQueryOptionsSchema.optional().default({
    page: PAGE_DEFAULT,
    limit: LIMIT_DEFAULT,
  }),
});

export type ListIndicateursRequest = z.input<
  typeof listIndicateursRequestSchema
>;
