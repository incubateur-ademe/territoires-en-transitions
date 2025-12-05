import { z } from 'zod';
import {
  baseCreateAxeOrPlanSchema,
  baseUpdateAxeOrPlanSchema,
} from '../../shared/mutate-axe-base.input';
import { personneIdSchema } from '../../shared/personne.dto';

/**
 * Schéma pour créer un plan
 */
export const createPlanSchema = baseCreateAxeOrPlanSchema;
export type CreatePlanInput = z.infer<typeof createPlanSchema>;

/**
 * Schéma pour mettre à jour un plan
 */
const updatePlanSchema = baseUpdateAxeOrPlanSchema;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;

/**
 * Options supplémentaires pour mutate (referents et pilotes)
 */
const mutatePlanOptionsSchema = z.object({
  referents: z.array(personneIdSchema).nullish(),
  pilotes: z.array(personneIdSchema).nullish(),
});

/**
 * Schéma pour mutate (create ou update avec options)
 */
export const mutatePlanSchema = z.union([
  updatePlanSchema.extend(mutatePlanOptionsSchema.shape),
  createPlanSchema.extend(mutatePlanOptionsSchema.shape),
]);

export type MutatePlanInput = z.infer<typeof mutatePlanSchema>;
