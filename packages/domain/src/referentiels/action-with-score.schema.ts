import * as z from 'zod/mini';
import { personneTagOrUserSchema } from '../collectivites/personne-tag-or-user.schema';
import { tagWithCollectiviteIdSchema } from '../collectivites/tag.base.schema';
import {
  ActionDefinition,
  actionDefinitionSchema,
  ActionId,
} from './actions/action-definition.schema';
import {
  actionScoreFinalSchema,
  ScoreFinalFields,
} from './scores/action-score.schema';

export const actionGenealogySchema = z.object({
  parentId: z.nullable(z.string()),
  childrenIds: z.array(z.string()),
  nextId: z.nullable(z.string()),
  previousId: z.nullable(z.string()),
});

export type ActionGenealogy = z.infer<typeof actionGenealogySchema>;

export const actionPilotesSchema = z.object({
  pilotes: z.array(personneTagOrUserSchema),
  services: z.array(tagWithCollectiviteIdSchema),
});

export type ActionPilotes = z.infer<typeof actionPilotesSchema>;

export const actionWithScoreSchema = z.object({
  ...actionDefinitionSchema.shape,
  ...actionPilotesSchema.shape,
  ...actionGenealogySchema.shape,

  score: actionScoreFinalSchema,
});

export type ActionWithDefinitionAndPilotes = ActionDefinition & ActionPilotes;

export type Action = ActionWithDefinitionAndPilotes &
  ActionGenealogy &
  ScoreFinalFields;

export type ActionsGroupedById = Record<ActionId, Action>;
