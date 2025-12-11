import { z } from 'zod';
import {
  baseCreateAxeOrPlanSchema,
  baseUpdateAxeOrPlanSchema,
} from './upsert-axe-base.input';

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

// options supplémentaires pouvant être passées lors de l'upsert
const upsertAxeOptionsSchema = z.object({});
export const upsertAxeSchema = z.union([
  updateAxeSchema.extend(upsertAxeOptionsSchema.shape),
  createAxeSchema.extend(upsertAxeOptionsSchema.shape),
]);
export type UpsertAxeInput = z.infer<typeof upsertAxeSchema>;
