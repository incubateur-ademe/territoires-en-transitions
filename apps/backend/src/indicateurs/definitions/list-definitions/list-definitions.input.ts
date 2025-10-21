import {
  getPaginationSchema,
  PAGE_DEFAULT,
} from '@/backend/utils/pagination.schema';
import { z } from 'zod';

export const listDefinitionsInputFiltersSchema = z.object({
  indicateurIds: z
    .int()
    .array()
    .optional()
    .describe("Identifiants de l'indicateur"),
  ficheIds: z
    .int()
    .array()
    .optional()
    .describe(
      "Identifiants des fiches actions auxquelles les indicateurs sont liés (au moins l'une d'entre elles)"
    ),
  identifiantsReferentiel: z
    .string()
    .array()
    .optional()
    .describe('Identifiants du référentiel'),
  // Additional filters to support the old endpoint functionality
  thematiqueIds: z
    .int()
    .array()
    .optional()
    .describe('Identifiants des thématiques'),
  utilisateurPiloteIds: z
    .string()
    .array()
    .optional()
    .describe('Identifiants des utilisateurs pilotes'),
  personnePiloteIds: z
    .int()
    .array()
    .optional()
    .describe('Identifiants des personnes pilotes'),
  serviceIds: z
    .int()
    .array()
    .optional()
    .describe('Identifiants des services pilotes'),
  planIds: z
    .int()
    .array()
    .optional()
    .describe("Identifiants des plans d'action"),
  mesureId: z.string().optional(),
  categorieNoms: z.string().array().optional().describe('Noms des catégories'),
  participationScore: z.boolean().optional().describe('Score de participation'),
  estRempli: z.boolean().optional().describe('Indicateur rempli'),
  estConfidentiel: z.boolean().optional().describe('Indicateur confidentiel'),
  estFavori: z.boolean().optional().describe('Favoris de la collectivité'),
  fichesNonClassees: z.boolean().optional().describe('Fiches non classées'),
  estPerso: z.boolean().optional().describe('Indicateur personnel'),
  hasOpenData: z.boolean().optional().describe('A des données ouvertes'),
  withChildren: z.boolean().optional().describe('Inclure les enfants'),
  text: z.string().optional().describe('Recherche textuelle'),
});

export type ListDefinitionsInputFilters = z.infer<
  typeof listDefinitionsInputFiltersSchema
>;

export const listDefinitionsInputSortValues = [
  'estRempli',
  'titre',
  'identifiantReferentiel',
] as const;

export type ListDefinitionsInputSort =
  (typeof listDefinitionsInputSortValues)[number];

const listDefinitionsInputQueryOptionsSchema = getPaginationSchema(
  listDefinitionsInputSortValues
);

export const listDefinitionsInputSchema = z.object({
  collectiviteId: z.number().optional(),
  filters: listDefinitionsInputFiltersSchema.optional().prefault({}),
  queryOptions: listDefinitionsInputQueryOptionsSchema.optional().prefault({
    page: PAGE_DEFAULT,
    limit: 50,
  }),
});

export type ListDefinitionsInput = z.output<typeof listDefinitionsInputSchema>;
