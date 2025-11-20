import * as z from 'zod/mini';
import { personneTagOrUserSchema } from '../../collectivites/personne-tag-or-user.schema';
import { tagWithCollectiviteIdSchema } from '../../collectivites/tag.base.schema';
import { actionDefinitionSchema } from '../actions/action-definition.schema';
import { statutAvancementIncludingNonConcerneEnumSchema } from '../actions/action-statut-avancement.enum.schema';
import { actionTypeSchema } from '../actions/action-type.enum';
import { actionScoreFinalSchema } from './action-score.schema';

export const actionWithScoreSchema = z.object({
  ...actionDefinitionSchema.shape,

  pilotes: z.array(personneTagOrUserSchema),
  services: z.array(tagWithCollectiviteIdSchema),
  statut: z.optional(statutAvancementIncludingNonConcerneEnumSchema),
  desactive: z.optional(z.boolean()),
  concerne: z.optional(z.boolean()),
  depth: z.optional(z.number()),
  actionType: z.optional(actionTypeSchema),

  score: z.optional(actionScoreFinalSchema),
});

export type ActionWithScore = z.infer<typeof actionWithScoreSchema>;
