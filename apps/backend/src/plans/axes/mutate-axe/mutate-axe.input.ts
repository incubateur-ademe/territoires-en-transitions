import { z } from 'zod';
import {
  baseCreateAxeOrPlanSchema,
  baseUpdateAxeOrPlanSchema,
} from './mutate-axe-base.input';

/**
 * Schéma pour créer un axe
 * Un axe a planId et parent (tous deux requis)
 */
export const createAxeSchema = baseCreateAxeOrPlanSchema.extend({
  planId: z.number().positive("Identifiant du plan auquel appartient l'axe"),
  parent: z.number().positive("Identifiant de l'axe parent"),
});
export type CreateAxeInput = z.infer<typeof createAxeSchema>;

/**
 * Schéma pour mettre à jour un axe
 */
export const updateAxeSchema = baseUpdateAxeOrPlanSchema.extend({
  planId: z
    .number()
    .positive("Identifiant du plan auquel appartient l'axe")
    .optional(),
  parent: z.number().positive("Identifiant de l'axe parent").optional(),
});
export type UpdateAxeInput = z.infer<typeof updateAxeSchema>;

export const upsertAxeSchema = z.union([createAxeSchema, updateAxeSchema]);
export type UpsertAxeInput = z.infer<typeof upsertAxeSchema>;

// options supplémentaires pouvant être passées lors du mutate
const mutateAxeOptionsSchema = z.object({});
export const mutateAxeSchema = z.union([
  updateAxeSchema.extend(mutateAxeOptionsSchema.shape),
  createAxeSchema.extend(mutateAxeOptionsSchema.shape),
]);
export type MutateAxeInput = z.infer<typeof mutateAxeSchema>;
