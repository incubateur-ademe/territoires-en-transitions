import { listFichesRequestFiltersObjectSchema } from '@tet/domain/plans';
import { z } from 'zod';

export const suiviPlanFiltersSchema = listFichesRequestFiltersObjectSchema.pick(
  {
    statuts: true,
    noStatut: true,
    priorites: true,
    noPriorite: true,
    personnePiloteIds: true,
    utilisateurPiloteIds: true,
    noPilote: true,
    personneReferenteIds: true,
    utilisateurReferentIds: true,
    noReferent: true,
    enCoursSansAvancement: true,
    notModifiedForOverAYear: true,
  }
);

export type SuiviPlanFilters = z.infer<typeof suiviPlanFiltersSchema>;

export const suiviPlanBlocInputSchema = z.object({
  planId: z.number().int().positive(),
  thematiqueIds: z.array(z.number().int()).optional(),
  filters: suiviPlanFiltersSchema.optional(),
});

export type SuiviPlanBlocInput = z.infer<typeof suiviPlanBlocInputSchema>;
