import { ComputeScoreMode } from '@/backend/referentiels/snapshots/compute-score-mode.enum';
import z from 'zod';
import { collectiviteAvecTypeSchema } from '../../collectivites/identite-collectivite.dto';
import {
  scoreFinalFieldsSchema,
  scoreFinalSchema,
} from '../compute-score/score.dto';
import { actionDefinitionEssentialSchema } from '../models/action-definition.dto';
import { actionDefinitionSchema } from '../models/action-definition.table';
import { referentielIdEnumSchema } from '../models/referentiel-id.enum';
import { snapshotJalonEnumSchema } from './snapshot-jalon.enum';

const actionIncludingScoreSchema = z.object({
  ...actionDefinitionSchema.pick({
    nom: true,
    identifiant: true,
    categorie: true,
  }).shape,
  ...actionDefinitionEssentialSchema.shape,
  ...scoreFinalFieldsSchema.shape,
});

export type ActionIncludingScore = z.infer<typeof actionIncludingScoreSchema>;

const treeOfActionsIncludingScoreSchema = actionIncludingScoreSchema.extend({
  get actionsEnfant() {
    return z.array(treeOfActionsIncludingScoreSchema);
  },
});

export type TreeOfActionsIncludingScore = z.infer<
  typeof treeOfActionsIncludingScoreSchema
>;

/**
 * Score de la collectivité pour un référentiel et une date donnée
 * Inclus les scores des actions et les scores indicatifs basés sur les indicateurs
 */
export const scoresPayloadSchema = z.object({
  collectiviteId: z.int(),
  referentielId: referentielIdEnumSchema,
  referentielVersion: z.string().optional(),
  collectiviteInfo: collectiviteAvecTypeSchema,
  date: z.iso.datetime(),
  scores: treeOfActionsIncludingScoreSchema,
  jalon: snapshotJalonEnumSchema,
  auditId: z.int().optional(),
  anneeAudit: z.number().optional(),
  mode: z.enum(ComputeScoreMode).optional(),
});

export type ScoresPayload = z.infer<typeof scoresPayloadSchema>;
