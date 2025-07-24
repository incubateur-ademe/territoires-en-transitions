import { getPaginationSchema } from '@/backend/utils/index-domain';
import { modifiedSinceSchema } from '@/backend/utils/modified-since.enum';
import { z } from 'zod';
import {
  ciblesEnumSchema,
  prioriteEnumSchema,
  statutsEnumSchema,
} from '../shared/models/fiche-action.table';

export const typePeriodeEnumValues = [
  'creation',
  'modification',
  'debut',
  'fin',
] as const;
export type TypePeriodeEnum = (typeof typePeriodeEnumValues)[number];

export const typePeriodeEnumSchema = z.enum(typePeriodeEnumValues);

export const listFichesRequestFiltersSchema = z
  .object({
    // `z.coerce.boolean()` is used to convert the string 'true' to a boolean
    // This is necessary because our custom `useSearchParams` only returns strings
    // TODO: use z.coerce.boolean() when we migrate to nuqs library
    noPilote: z.coerce
      .boolean()
      .optional()
      .describe(
        `Aucun utilisateur ou personne pilote n'est associé à la fiche`
      ),
    hasBudgetPrevisionnel: z.coerce
      .boolean()
      .optional()
      .describe(`A un budget prévisionnel`),
    hasIndicateurLies: z.coerce
      .boolean()
      .optional()
      .describe(`A indicateur(s) associé(s)`),
    indicateurIds: z.array(z.coerce.number()).optional(),
    hasMesuresLiees: z.coerce
      .boolean()
      .optional()
      .describe(`A mesure(s) des référentiels associée(s)`),
    isBelongsToSeveralPlans: z.coerce
      .boolean()
      .optional()
      .describe(`Actions mutualisées dans plusieurs plans`),
    hasDateDeFinPrevisionnelle: z.coerce
      .boolean()
      .optional()
      .describe(`A une date de fin prévisionnelle`),
    ameliorationContinue: z.coerce
      .boolean()
      .optional()
      .describe(`Est en amélioration continue`),
    restreint: z.coerce
      .boolean()
      .optional()
      .describe(`Fiche action en mode privé`),
    noServicePilote: z.coerce
      .boolean()
      .optional()
      .describe(`Aucune direction ou service pilote n'est associée à la fiche`),
    sharedWithCollectivites: z
      .boolean()
      .optional()
      .describe(`Fiche action mutualisée avec d'autres collectivités`),
    noStatut: z.coerce.boolean().optional().describe(`Aucun statut`),
    noTag: z.coerce.boolean().optional().describe(`Aucun tag personnalisés`),
    statuts: z
      .array(statutsEnumSchema)
      .optional()
      .describe('Liste des statuts séparés par des virgules'),

    noPriorite: z.coerce.boolean().optional().describe(`Aucune priorité`),
    priorites: z
      .array(prioriteEnumSchema)
      .optional()
      .describe('Liste des priorités séparés par des virgules'),
    cibles: z
      .array(ciblesEnumSchema)
      .optional()
      .describe('Liste des cibles séparées par des virgules'),

    hasNoteDeSuivi: z
      .boolean()
      .optional()
      .describe(`A une note de suivi ou n'a pas de note de suivi`),
    anneesNoteDeSuivi: z
      .array(z.coerce.string())
      .optional()
      .describe('Années des notes de suivi séparées par des virgules'),

    ficheIds: z
      .array(z.coerce.number())
      .optional()
      .describe('Liste des identifiants des fiches séparés par des virgules'),
    partenaireIds: z
      .array(z.coerce.number())
      .optional()
      .describe(
        'Liste des identifiants de tags de partenaires séparés par des virgules'
      ),
    financeurIds: z
      .array(z.coerce.number())
      .optional()
      .describe(
        'Liste des identifiants de tags de financeur séparés par des virgules'
      ),
    thematiqueIds: z
      .array(z.coerce.number())
      .optional()
      .describe(
        'Liste des identifiants de thématiques séparés par des virgules'
      ),
    sousThematiqueIds: z
      .array(z.coerce.number())
      .optional()
      .describe(
        'Liste des identifiants de sous-thématiques séparés par des virgules'
      ),
    personnePiloteIds: z
      .array(z.coerce.number())
      .optional()
      .describe(
        'Liste des identifiants de tags des personnes pilote séparées par des virgules'
      ),
    utilisateurPiloteIds: z
      .string()
      .array()
      .optional()
      .describe(
        'Liste des identifiants des utilisateurs pilote séparées par des virgules'
      ),
    libreTagsIds: z
      .array(z.coerce.number())
      .optional()
      .describe(
        'Liste des identifiants des tags libres séparées par des virgules'
      ),

    noReferent: z.coerce.boolean().optional(),
    personneReferenteIds: z
      .array(z.coerce.number())
      .optional()
      .describe(
        'Liste des identifiants de tags des personnes pilote séparées par des virgules'
      ),
    utilisateurReferentIds: z
      .string()
      .array()
      .optional()
      .describe(
        'Liste des identifiants des utilisateurs pilote séparées par des virgules'
      ),
    servicePiloteIds: z
      .array(z.coerce.number())
      .optional()
      .describe(
        'Liste des identifiants de tags de services séparés par des virgules'
      ),
    structurePiloteIds: z
      .array(z.coerce.number())
      .optional()
      .describe('Liste des identifiants de structure séparés par des virgules'),

    noPlan: z.coerce.boolean().optional().describe(`Aucun plan`),
    planActionIds: z
      .array(z.coerce.number())
      .optional()
      .describe(
        "Liste des identifiants des plans d'action séparés par des virgules"
      ),
    mesureIds: z
      .string()
      .array()
      .optional()
      .describe(
        'Liste des identifiants des mesures du référentiel séparés par des virgules'
      ),
    linkedFicheIds: z
      .array(z.coerce.number())
      .optional()
      .describe(
        'Liste des identifiants des fiches liées séparés par des virgules'
      ),
    modifiedAfter: z
      .string()
      .datetime()
      .optional()
      .describe('Uniquement les fiches modifiées après cette date'),
    typePeriode: typePeriodeEnumSchema.optional(),
    debutPeriode: z.string().datetime().optional(),
    finPeriode: z.string().datetime().optional(),
    modifiedSince: modifiedSinceSchema
      .optional()
      .describe(
        'Filtre sur la date de modification en utilisant des valeurs prédéfinies'
      ),
    texteNomOuDescription: z.string().optional(),
  })
  .describe('Filtre de récupération des fiches action');

export type ListFichesRequestFilters = z.output<
  typeof listFichesRequestFiltersSchema
>;
export type ListFichesRequestFiltersKeys = keyof ListFichesRequestFilters;

export const isListFichesRequestFiltersKeys = (
  filters: string
): filters is ListFichesRequestFiltersKeys => {
  return Object.keys(listFichesRequestFiltersSchema.shape).includes(filters);
};

const sortValues = ['modified_at', 'created_at', 'titre'] as const;

export type ListFichesSortValue = (typeof sortValues)[number];

const listFichesRequestQueryOptionsSchema = getPaginationSchema(sortValues);

export type ListFichesRequestQueryOptions = z.infer<
  typeof listFichesRequestQueryOptionsSchema
>;

export const listFichesRequestSchema = z.object({
  collectiviteId: z.coerce.number(),
  filters: listFichesRequestFiltersSchema.optional(),
  queryOptions: listFichesRequestQueryOptionsSchema.partial().optional(),
});

export type ListFichesRequest = z.infer<typeof listFichesRequestSchema>;
