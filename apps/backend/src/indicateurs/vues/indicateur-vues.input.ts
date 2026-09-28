import {
  indicateurVueFiltersSchema,
  indicateurVueNomSchema,
} from '@tet/domain/indicateurs';
import { z } from 'zod';

export const listIndicateurVuesInputSchema = z.strictObject({
  collectiviteId: z.number().int().positive(),
});

export const deleteIndicateurVueInputSchema =
  listIndicateurVuesInputSchema.extend({
    id: z.uuid(),
  });

export const createIndicateurVueInputSchema =
  listIndicateurVuesInputSchema.extend({
    nom: indicateurVueNomSchema,
    filtres: indicateurVueFiltersSchema,
  });

export const updateIndicateurVueInputSchema = deleteIndicateurVueInputSchema
  .extend({
    nom: indicateurVueNomSchema.optional(),
    filtres: indicateurVueFiltersSchema.optional(),
  })
  .refine((input) => input.nom !== undefined || input.filtres !== undefined, {
    message: 'Le nom ou les filtres doivent être renseignés',
  });

export type ListIndicateurVuesInput = z.infer<
  typeof listIndicateurVuesInputSchema
>;
export type CreateIndicateurVueInput = z.infer<
  typeof createIndicateurVueInputSchema
>;
export type UpdateIndicateurVueInput = z.infer<
  typeof updateIndicateurVueInputSchema
>;
export type DeleteIndicateurVueInput = z.infer<
  typeof deleteIndicateurVueInputSchema
>;
