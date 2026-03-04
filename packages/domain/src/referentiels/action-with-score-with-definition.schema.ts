import { z } from 'zod/mini';
import { actionDefinitionSchema } from './actions/action-definition.schema';
import { actionScoreFinalSchema } from './scores/action-score.schema';

export const actionWithScoreWithDefinitionSchema = z.object({
  ...actionDefinitionSchema.shape,
  ...actionScoreFinalSchema.shape,
});

export type ActionWithScoreWithDefinition = z.infer<
  typeof actionWithScoreWithDefinitionSchema
>;
