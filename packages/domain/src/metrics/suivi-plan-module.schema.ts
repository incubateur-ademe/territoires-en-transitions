import z from 'zod';
import { countByPropertyEnumSchema } from '../plans/count-by-property-options.enum';
import { listFichesRequestFiltersSchema } from '../plans/filters';
import { moduleFicheActionCountBySchema } from './module-fiche-action-count-by.schema';

export const suiviPlanCountByPropertyEnumSchema =
  countByPropertyEnumSchema.exclude([
    'plans',
    'restreint',
    'sousThematiques',
    'createdAt',
    'budgetsDepenseFonctionnementTotal',
    'budgetsDepenseFonctionnementParAnnee',
    'budgetsPrevisionnelFonctionnementParAnnee',
  ]);

export type SuiviPlanCountByProperty = z.infer<
  typeof suiviPlanCountByPropertyEnumSchema
>;

export const suiviPlanModuleSchema = moduleFicheActionCountBySchema.extend({
  planId: z.number().int(),
});

export type SuiviPlanModule = z.infer<typeof suiviPlanModuleSchema>;

export const upsertSuiviPlanModuleInputSchema = z.object({
  planId: z.number().int().positive(),
  id: z.uuid().optional(),
  titre: z.string().trim().min(1),
  options: z.object({
    countByProperty: suiviPlanCountByPropertyEnumSchema,
    filtre: listFichesRequestFiltersSchema,
  }),
});

export type UpsertSuiviPlanModuleInput = z.infer<
  typeof upsertSuiviPlanModuleInputSchema
>;
