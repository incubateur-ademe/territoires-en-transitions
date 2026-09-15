import * as z from 'zod/mini';
import { personneTagOrUserSchema } from '../collectivites/personne-tag-or-user.schema';
import { tagWithCollectiviteIdSchema } from '../collectivites/tag.base.schema';
import {
  ActionDefinition,
  actionDefinitionSchema,
  ActionId,
  actionIdSchema,
} from './actions/action-definition.schema';
import { referentielLabelEnumSchema } from './referentiel-label.enum';
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

export const actionLabelsSchema = z.object({
  labels: z.array(referentielLabelEnumSchema),
});

export type ActionLabels = z.infer<typeof actionLabelsSchema>;

export const actionWithScoreSchema = z.object({
  ...actionDefinitionSchema.shape,
  ...actionPilotesSchema.shape,
  ...actionLabelsSchema.shape,
  ...actionGenealogySchema.shape,

  score: actionScoreFinalSchema,
  childrenIdsWithExprScore: z.array(actionIdSchema),
});

export type ActionWithDefinitionAndPilotes = ActionDefinition &
  ActionPilotes &
  ActionLabels;

export type Action = ActionWithDefinitionAndPilotes &
  ActionGenealogy &
  ScoreFinalFields & {
    childrenIdsWithExprScore: ActionId[];
  };

export type ActionsGroupedById = Record<ActionId, Action>;

export type HiddenActionSummary = Pick<
  Action,
  'actionId' | 'identifiant' | 'nom'
>;

export type ListActionsGroupedByIdResult = {
  actionsById: ActionsGroupedById;
  hiddenActions: HiddenActionSummary[];
};
