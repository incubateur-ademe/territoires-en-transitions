import { z } from 'zod';
import {
  CollectiviteAvecType,
  collectiviteAvecTypeSchema,
} from '../../collectivites/identite-collectivite.dto';
import { ComputeScoreMode } from '../compute-score/compute-score-mode.enum';
import {
  ScoreFinalFields,
  scoreFinalFieldsSchema,
} from '../compute-score/score.dto';
import {
  ActionDefinitionEssential,
  actionDefinitionEssentialSchema,
  TreeNode,
  treeNodeSchema,
} from '../models/action-definition.dto';
import {
  ActionDefinition,
  actionDefinitionSchema,
} from '../models/action-definition.table';
import {
  ReferentielId,
  referentielIdEnumSchema,
} from '../models/referentiel-id.enum';
import { SnapshotJalon, snapshotJalonEnumSchema } from './snapshot-jalon.enum';

// export const getReferentielScoresResponseSnapshotInfoSchema = z.object({
//   ref: z.string(),
//   nom: z.string(),
//   createdAt: z.string().datetime(),
//   createdBy: z.string().nullable(),
//   modifiedAt: z.string().datetime(),
//   modifiedBy: z.string().nullable(),
// });

export const scoresPayloadSchema = z
  .object({
    collectiviteId: z.number(),
    referentielId: referentielIdEnumSchema,
    referentielVersion: z.string(),
    auditId: z.number().optional(),
    date: z.string().datetime(),
    jalon: snapshotJalonEnumSchema,

    collectiviteInfo: collectiviteAvecTypeSchema,
    scores: treeNodeSchema(
      actionDefinitionSchema
        .pick({ identifiant: true, nom: true, categorie: true })
        .merge(actionDefinitionEssentialSchema)
        .merge(scoreFinalFieldsSchema)
    ),
    anneeAudit: z.number().optional(),
    // snapshot: getReferentielScoresResponseSnapshotInfoSchema.optional(),
    mode: z.nativeEnum(ComputeScoreMode),
  })
  .describe('Score de la collectivité pour un référentiel et la date donnée');

export type ScoresPayload = {
  collectiviteId: number;
  referentielId: ReferentielId;
  referentielVersion: string;
  collectiviteInfo: CollectiviteAvecType;
  date: string;
  scores: TreeNode<
    Pick<ActionDefinition, 'nom' | 'identifiant' | 'categorie'> &
      ActionDefinitionEssential &
      ScoreFinalFields
  >;
  jalon: SnapshotJalon;
  auditId?: number;
  anneeAudit?: number;
  // snapshot?: {
  //   ref: string;
  //   nom: string;
  //   createdAt: string;
  //   createdBy: string | null;
  //   modifiedAt: string;
  //   modifiedBy: string | null;
  // };
  mode: ComputeScoreMode;
};
