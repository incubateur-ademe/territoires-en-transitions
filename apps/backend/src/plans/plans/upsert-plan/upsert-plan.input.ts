import { personneIdSchema } from '@tet/domain/collectivites';
import { z } from 'zod';
import {
  baseCreateAxeOrPlanSchema,
  baseUpdateAxeOrPlanSchema,
} from '../../axes/upsert-axe/upsert-axe-base.input';

/**
 * Schéma pour créer un plan
 */
export const createPlanSchema = baseCreateAxeOrPlanSchema;
export type CreatePlanInput = z.infer<typeof createPlanSchema>;

/**
 * Schéma pour mettre à jour un plan
 */
export const updatePlanSchema = baseUpdateAxeOrPlanSchema;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;

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
export const upsertPlanSchema = z.union([
  updatePlanSchema.extend(upsertPlanOptionsSchema.shape),
  createPlanSchema.extend(upsertPlanOptionsSchema.shape),
]);

export type UpsertPlanInput = z.infer<typeof upsertPlanSchema>;
