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
    noPilote: z
      .boolean()
      .optional()
      .describe(
        `Aucun utilisateur ou personne pilote n'est associé à la fiche`
      ),
    budgetPrevisionnel: z
      .boolean()
      .optional()
      .describe(`A un budget prévisionnel`),
    hasIndicateurLies: z
      .boolean()
      .optional()
      .describe(`A indicateur(s) associé(s)`),
    hasMesuresLiees: z
      .boolean()
      .optional()
      .describe(`A mesure(s) des référentiels associée(s)`),
    ameliorationContinue: z
      .boolean()
      .optional()
      .describe(`Est en amélioration continue`),
    restreint: z.boolean().optional().describe(`Fiche action en mode privé`),
    noServicePilote: z
      .boolean()
      .optional()
      .describe(`Aucune direction ou service pilote n'est associée à la fiche`),
    noStatut: z.boolean().optional().describe(`Aucun statut`),
    statuts: z
      .array(statutsEnumSchema)
      .optional()
      .describe('Liste des statuts séparés par des virgules'),
    noPriorite: z.boolean().optional().describe(`Aucune priorité`),
    priorites: z
      .array(prioriteEnumSchema)
      .optional()
      .describe('Liste des priorités séparés par des virgules'),
    cibles: z
      .array(ciblesEnumSchema)
      .optional()
      .describe('Liste des cibles séparées par des virgules'),
    ficheIds: z
      .number()
      .array()
      .optional()
      .describe('Liste des identifiants des fiches séparés par des virgules'),
    partenaireIds: z
      .number()
      .array()
      .optional()
      .describe(
        'Liste des identifiants de tags de partenaires séparés par des virgules'
      ),
    financeurIds: z
      .number()
      .array()
      .optional()
      .describe(
        'Liste des identifiants de tags de financeur séparés par des virgules'
      ),
    thematiqueIds: z
      .number()
      .array()
      .optional()
      .describe(
        'Liste des identifiants de thématiques séparés par des virgules'
      ),
    sousThematiqueIds: z
      .number()
      .array()
      .optional()
      .describe(
        'Liste des identifiants de sous-thématiques séparés par des virgules'
      ),
    personnePiloteIds: z
      .number()
      .array()
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
      .number()
      .array()
      .optional()
      .describe(
        'Liste des identifiants des tags libres séparées par des virgules'
      ),
    personneReferenteIds: z
      .number()
      .array()
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
      .number()
      .array()
      .optional()
      .describe(
        'Liste des identifiants de tags de services séparés par des virgules'
      ),
    structurePiloteIds: z
      .number()
      .array()
      .optional()
      .describe('Liste des identifiants de structure séparés par des virgules'),
    planActionIds: z
      .number()
      .array()
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
    linkedFicheActionIds: z
      .number()
      .array()
      .optional()
      .describe(
        'Liste des identifiants des fiches action liées séparés par des virgules'
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

export type ListFichesRequestFilters = z.infer<
  typeof listFichesRequestFiltersSchema
>;

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
