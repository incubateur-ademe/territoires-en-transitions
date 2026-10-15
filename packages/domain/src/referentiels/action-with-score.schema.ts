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

export const actionThematiqueSchema = z.object({
  ref: z.string(),
  nom: z.string(),
});

export type ActionThematique = z.infer<typeof actionThematiqueSchema>;

export const actionTagsSchema = z.object({
  isCoremeasure: z.boolean(),
  thematiques: z.array(actionThematiqueSchema),
});

export type ActionTags = z.infer<typeof actionTagsSchema>;

export const actionWithScoreSchema = z.object({
  ...actionDefinitionSchema.shape,
  ...actionPilotesSchema.shape,
  ...actionLabelsSchema.shape,
  ...actionTagsSchema.shape,
  ...actionGenealogySchema.shape,

  score: actionScoreFinalSchema,
  childrenIdsWithExprScore: z.array(actionIdSchema),
});

export type ActionWithDefinitionAndPilotes = ActionDefinition &
  ActionPilotes &
  ActionLabels &
  ActionTags;

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

/**
 * Partie statique d'une action : ne change qu'à la publication d'une nouvelle
 * version du référentiel. Indépendante de la collectivité.
 */
export const actionStaticDefinitionSchema = z.object({
  ...actionDefinitionSchema.shape,
  ...actionLabelsSchema.shape,
  ...actionTagsSchema.shape,
});

export type ActionStaticDefinition = z.infer<
  typeof actionStaticDefinitionSchema
>;

/**
 * Partie dynamique d'une action pour une collectivité : scores, pilotes et
 * services, et généalogie (qui dépend des mesures désactivées en TE).
 */
export type ActionDynamicState = Pick<ActionDefinition, 'actionId'> &
  ActionPilotes &
  ActionGenealogy &
  ScoreFinalFields;

export type ListActionsDynamicStateResult = {
  /** Version publiée courante du référentiel (pas celle du snapshot) */
  referentielVersion: string;
  actionsById: Record<ActionId, ActionDynamicState>;
  hiddenActionIds: ActionId[];
};
