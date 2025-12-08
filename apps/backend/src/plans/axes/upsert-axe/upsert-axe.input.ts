import { z } from 'zod';
import {
  baseCreateAxeOrPlanSchema,
  baseUpdateAxeOrPlanSchema,
} from './upsert-axe-base.input';

/**
 * Schéma pour créer un axe
 * Un axe a planId et parent (tous deux requis)
 */
export const baseCreateAxeSchema = baseCreateAxeOrPlanSchema.extend({
  planId: z.number().positive("Identifiant du plan auquel appartient l'axe"),
  parent: z.number().positive("Identifiant de l'axe parent"),
});
export type BaseCreateAxeInput = z.infer<typeof baseCreateAxeSchema>;

/**
 * Schéma pour mettre à jour un axe
 */
export const baseUpdateAxeSchema = baseUpdateAxeOrPlanSchema.extend({
  planId: z
    .number()
    .positive("Identifiant du plan auquel appartient l'axe")
    .optional(),
  parent: z.number().positive("Identifiant de l'axe parent").optional(),
});
export type BaseUpdateAxeInput = z.infer<typeof baseUpdateAxeSchema>;

// options supplémentaires pouvant être passées lors de l'upsert
const upsertAxeOptionsSchema = z.object({
  indicateurs: z
    .array(
      z.object({
        id: z.number().positive("Identifiant d'un indicateur associé à l'axe"),
      })
    )
    .nullish(),
});

export const updateAxeSchema = baseUpdateAxeSchema.extend(
  upsertAxeOptionsSchema.shape
);
export type UpdateAxe = z.infer<typeof updateAxeSchema>;

export const createAxeSchema = baseCreateAxeSchema.extend(
  upsertAxeOptionsSchema.shape
);
export type CreateAxe = z.infer<typeof createAxeSchema>;

export const upsertAxeSchema = z.union([updateAxeSchema, createAxeSchema]);
export type UpsertAxeInput = z.infer<typeof upsertAxeSchema>;
