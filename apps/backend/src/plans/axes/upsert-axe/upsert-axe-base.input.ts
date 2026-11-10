import { z } from 'zod';

/**
 * Champs communs pour créer un axe ou un plan
 */
export const baseCreateAxeOrPlanSchema = z.object({
  // Attribution réservée à l'orchestration interne après résolution.
  referenceProgramme: z.never().optional(),
  referenceCode: z.never().optional(),
  engagementsCodes: z.never().optional(),
  indicateurSourceMetadonneeId: z.never().optional(),
  reference: z.never().optional(),
  engagements: z.never().optional(),
  nom: z.string().nullish(),
  description: z.string().nullish(),
  collectiviteId: z.number().positive("L'ID de la collectivité est requis"),
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
