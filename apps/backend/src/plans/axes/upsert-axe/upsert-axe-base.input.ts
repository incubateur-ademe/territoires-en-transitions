import { z } from 'zod';

/**
 * Champs communs pour créer un axe ou un plan
 */
export const baseCreateAxeOrPlanSchema = z.object({
  nom: z.string().optional(),
  collectiviteId: z.number().positive("L'ID de la collectivité est requis"),
  typeId: z.number().optional(),
});

export type BaseCreateAxeOrPlanInput = z.infer<
  typeof baseCreateAxeOrPlanSchema
>;

/**
 * Champs communs pour mettre à jour un axe ou un plan
 */
export const baseUpdateAxeOrPlanSchema = baseCreateAxeOrPlanSchema.extend({
  id: z.number().positive("L'identifiant est requis"),
});

export type BaseUpdateAxeOrPlanInput = z.infer<
  typeof baseUpdateAxeOrPlanSchema
>;
