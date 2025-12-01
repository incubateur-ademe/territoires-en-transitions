import { z } from 'zod';
import {
  baseCreateAxeOrPlanSchema,
  baseUpdateAxeOrPlanSchema,
} from '../../shared/mutate-axe-base.input';

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
 * Schéma pour une personne (référent ou pilote)
 */
export const personneSchema = z.union([
  z.object({ tagId: z.number(), userId: z.null().optional() }),
  z.object({ tagId: z.null().optional(), userId: z.string() }),
]);
export type PersonneInput = z.infer<typeof personneSchema>;

/**
 * Options supplémentaires pour mutate (referents et pilotes)
 */
const mutatePlanOptionsSchema = z.object({
  referents: z.array(personneSchema).nullish(),
  pilotes: z.array(personneSchema).nullish(),
});

/**
 * Schéma pour mutate (create ou update avec options)
 */
export const mutatePlanSchema = z.union([
  updatePlanSchema.extend(mutatePlanOptionsSchema.shape),
  createPlanSchema.extend(mutatePlanOptionsSchema.shape),
]);

export type MutatePlanInput = z.infer<typeof mutatePlanSchema>;
