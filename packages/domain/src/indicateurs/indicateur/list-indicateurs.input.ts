import { z } from 'zod';

export const listIndicateursInputFiltersSchema = z.object({
  indicateurIds: z.number().int().array().optional(),
  ficheIds: z.number().int().array().optional(),
  identifiantsReferentiel: z.string().array().optional(),
  thematiqueIds: z.number().int().array().optional(),
  utilisateurPiloteIds: z.uuid().array().optional(),
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
  isApplicable: z.boolean().optional(),
  estPerso: z.boolean().optional(),
  hasOpenData: z.boolean().optional(),
  withChildren: z.boolean().optional(),
  text: z.string().optional(),
});

export type ListIndicateursInputFilters = z.infer<
  typeof listIndicateursInputFiltersSchema
>;

export const listIndicateursInputSortValues = [
  'estRempli',
  'titre',
  'identifiantReferentiel',
] as const;

export type ListIndicateursInputSort =
  (typeof listIndicateursInputSortValues)[number];
