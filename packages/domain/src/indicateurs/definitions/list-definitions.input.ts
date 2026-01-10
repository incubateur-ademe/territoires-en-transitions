import { z } from 'zod';
import {
  getPaginationSchema,
  PAGE_DEFAULT,
} from '../../utils/pagination.schema';

export const listDefinitionsInputFiltersSchema = z.object({
  indicateurIds: z.number().int().array().optional(),
  ficheIds: z.number().int().array().optional(),
  identifiantsReferentiel: z.string().array().optional(),
  thematiqueIds: z.number().int().array().optional(),
  utilisateurPiloteIds: z.string().array().optional(),
  personnePiloteIds: z.number().int().array().optional(),
  serviceIds: z.number().int().array().optional(),
  planIds: z.number().int().array().optional(),
  axeIds: z.number().int().array().optional(),
  mesureId: z.string().optional(),
  categorieNoms: z.string().array().optional(),
  participationScore: z.boolean().optional(),
  estRempli: z.boolean().optional(),
  estConfidentiel: z.boolean().optional(),
  estFavori: z.boolean().optional(),
  fichesNonClassees: z.boolean().optional(),
  estPerso: z.boolean().optional(),
  hasOpenData: z.boolean().optional(),
  withChildren: z.boolean().optional(),
  text: z.string().optional(),
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
