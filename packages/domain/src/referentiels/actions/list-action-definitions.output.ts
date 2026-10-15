import * as z from 'zod/mini';
import { actionStaticDefinitionSchema } from '../action-with-score.schema';
import { actionIdSchema } from './action-definition.schema';

export const listActionDefinitionsOutputSchema = z.object({
  /** Version publiée courante du référentiel */
  referentielVersion: z.string(),
  definitionsById: z.record(actionIdSchema, actionStaticDefinitionSchema),
});

export type ListActionDefinitionsOutput = z.infer<
  typeof listActionDefinitionsOutputSchema
>;
