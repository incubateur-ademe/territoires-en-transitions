import * as z from 'zod/mini';
import { collectiviteAvecTypeSchema } from '../../collectivites/identite-collectivite.schema';
import {
  actionDefinitionEssentialSchema,
  actionDefinitionSchema,
} from '../actions/action-definition.schema';
import { referentielIdEnumSchema } from '../referentiel-id.enum';
import { scoreFinalFieldsSchema } from './action-score.schema.js';
import { scoreComnputeModeEnumSchema } from './score-compute-mode.enum.schema';
import { snapshotJalonEnumSchema } from './snapshot-jalon.enum';

export const actionIncludingScoreSchema = z.object({
  ...z.pick(actionDefinitionSchema, {
    nom: true,
    identifiant: true,
    categorie: true,
  }).shape,

  ...actionDefinitionEssentialSchema.shape,
  ...scoreFinalFieldsSchema.shape,
});

export type ActionIncludingScore = z.infer<typeof actionIncludingScoreSchema>;

type RecursiveTreeNode<T> = T & {
  get actionsEnfant(): RecursiveTreeNode<T>[];
};

export type ActionTreeNode<T> = T extends infer R
  ? RecursiveTreeNode<R>
  : never;

export type TreeOfActionsIncludingScore = ActionTreeNode<ActionIncludingScore>;

/**
 * Score de la collectivité pour un référentiel et une date donnée
 * Inclus les scores des actions et les scores indicatifs basés sur les indicateurs
 */
export const scoresPayloadSchemaWithoutScoresJsonTree = z.object({
  collectiviteId: z.int(),
  referentielId: referentielIdEnumSchema,
  referentielVersion: z.optional(z.string()),
  collectiviteInfo: collectiviteAvecTypeSchema,
  date: z.iso.datetime(),
  scores: z.json(),
  jalon: snapshotJalonEnumSchema,
  auditId: z.optional(z.int()),
  anneeAudit: z.optional(z.number()),
  mode: z.optional(scoreComnputeModeEnumSchema),
});

type ScoresPayloadWithoutScoresJsonTree = z.infer<
  typeof scoresPayloadSchemaWithoutScoresJsonTree
>;

export interface ScoresPayload extends ScoresPayloadWithoutScoresJsonTree {
  scores: TreeOfActionsIncludingScore;
}
