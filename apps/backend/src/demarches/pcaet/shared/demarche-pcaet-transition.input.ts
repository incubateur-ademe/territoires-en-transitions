import { z } from 'zod';

/**
 * Toute opération de transition vise une démarche, et rien d'autre : la
 * transition, elle, est celle de la route appelée.
 */
export const demarchePcaetTransitionInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
});

export type DemarchePcaetTransitionInput = z.infer<
  typeof demarchePcaetTransitionInputSchema
>;
