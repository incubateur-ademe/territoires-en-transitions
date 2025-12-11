import { personneIdSchema } from '@tet/domain/collectivites';
import { z } from 'zod';
import {
  baseCreateAxeOrPlanSchema,
  baseUpdateAxeOrPlanSchema,
} from '../../axes/upsert-axe/upsert-axe-base.input';

/**
 * Schéma pour créer un plan
 */
export const baseCreatePlanSchema = baseCreateAxeOrPlanSchema;
export type BaseCreatePlanInput = z.infer<typeof baseCreatePlanSchema>;

/**
 * Schéma pour mettre à jour un plan
 */
export const baseUpdatePlanSchema = baseUpdateAxeOrPlanSchema;
export type BaseUpdatePlanInput = z.infer<typeof baseUpdatePlanSchema>;

/**
 * Options supplémentaires pour upsert (referents et pilotes)
 */
const upsertPlanOptionsSchema = z.object({
  referents: z.array(personneIdSchema).nullish(),
  pilotes: z.array(personneIdSchema).nullish(),
});

/**
 * Schéma pour upsert (create ou update avec options)
 */
export const updatePlanSchema = baseUpdatePlanSchema.extend(
  upsertPlanOptionsSchema.shape
);
export type UpdatePlan = z.infer<typeof updatePlanSchema>;

export const createPlanSchema = baseCreatePlanSchema.extend(
  upsertPlanOptionsSchema.shape
);
export type CreatePlan = z.infer<typeof createPlanSchema>;

export const upsertPlanSchema = z.union([updatePlanSchema, createPlanSchema]);
export type UpsertPlanInput = z.infer<typeof upsertPlanSchema>;
