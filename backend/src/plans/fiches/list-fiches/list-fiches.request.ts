import {
  getPaginationSchema,
  zodQueryBoolean,
} from '@/backend/utils/index-domain';
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
    // `zodQueryBoolean` is used to convert the string 'true' to a boolean
    // This is necessary because our custom `useSearchParams` only returns strings
    // TODO: use z.boolean() when we migrate to nuqs library
    noPilote: zodQueryBoolean
      .optional()
      .describe(
        `Aucun utilisateur ou personne pilote n'est associé à la fiche`
      ),
    hasBudgetPrevisionnel: zodQueryBoolean
      .optional()
      .describe(`A un budget prévisionnel`),
    hasIndicateurLies: zodQueryBoolean
      .optional()
      .describe(`A indicateur(s) associé(s)`),
    indicateurIds: z.array(z.coerce.number()).optional(),
    hasMesuresLiees: zodQueryBoolean
      .optional()
      .describe(`A mesure(s) des référentiels associée(s)`),
    ameliorationContinue: zodQueryBoolean
      .optional()
      .describe(`Est en amélioration continue`),
    restreint: z.boolean().optional().describe(`Fiche action en mode privé`),
    noServicePilote: zodQueryBoolean
      .optional()
      .describe(`Aucune direction ou service pilote n'est associée à la fiche`),
    noStatut: zodQueryBoolean.optional().describe(`Aucun statut`),
    statuts: z
      .array(statutsEnumSchema)
      .optional()
      .describe('Liste des statuts séparés par des virgules'),
    noPriorite: zodQueryBoolean.optional().describe(`Aucune priorité`),
    priorites: z
      .array(prioriteEnumSchema)
      .optional()
      .describe('Liste des priorités séparés par des virgules'),
    cibles: z
      .array(ciblesEnumSchema)
      .optional()
      .describe('Liste des cibles séparées par des virgules'),
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
    noPlan: z.boolean().optional().describe(`Aucun plan`),
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
