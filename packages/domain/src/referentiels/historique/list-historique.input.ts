import z from 'zod';
import { historiqueTypeSchema } from './historique-type.enum';

/** Nombre d'éléments par page pour l'historique */
export const NB_HISTORIQUE_ITEMS_PER_PAGE = 10;

export const listHistoriqueInputFiltersSchema = z.object({
  modifiedBy: z.string().array().optional(),
  types: historiqueTypeSchema.array().optional(),
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
  page: z.number().int().positive().optional(),
});

export const listHistoriqueInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  actionId: z.string().optional(),
  filters: listHistoriqueInputFiltersSchema.default({}),
});

export type ListHistoriqueInput = z.infer<typeof listHistoriqueInputSchema>;
export type ListHistoriqueInputFilters = z.infer<
  typeof listHistoriqueInputFiltersSchema
>;

export const listHistoriqueUtilisateurInputSchema = z.object({
  collectiviteId: z.number(),
});

export type ListHistoriqueUtilisateurInput = z.infer<
  typeof listHistoriqueUtilisateurInputSchema
>;
