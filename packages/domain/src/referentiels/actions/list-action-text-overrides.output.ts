import * as z from 'zod/mini';
import { actionIdSchema } from './action-definition.schema';
import { actionTextOverridesSchema } from './action-text-overrides.schema';

export const listActionTextOverridesOutputSchema = z.object({
  /** Version publiée courante du référentiel */
  referentielVersion: z.string(),
  textVariantKey: z.string(),
  /** Actions balisées dont un texte diffère du rendu par défaut pour ce profil */
  overridesById: z.record(actionIdSchema, actionTextOverridesSchema),
});

export type ListActionTextOverridesOutput = z.infer<
  typeof listActionTextOverridesOutputSchema
>;
