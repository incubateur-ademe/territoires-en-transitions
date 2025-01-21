import { z } from 'zod';
import { collectiviteAvecTypeSchema } from '../../collectivites/identite-collectivite.dto';
import { actionWithScoreFinalSchema } from '../compute-score/action-with-score.dto';
import { SnapshotJalon } from '../snapshots/snapshot-jalon.enum';
import { ComputeScoreMode } from './compute-scores-mode.enum';
import { referentielIdEnumSchema } from './referentiel.enum';

export const getReferentielScoresResponseSnapshotInfoSchema = z.object({
  ref: z.string(),
  nom: z.string(),
  createdAt: z.string().datetime(),
  createdBy: z.string().nullable(),
  modifiedAt: z.string().datetime(),
  modifiedBy: z.string().nullable(),
});

export const getReferentielScoresResponseSchema = z
  .object({
    collectiviteId: z.number(),
    referentielId: referentielIdEnumSchema,
    referentielVersion: z.string(),
    collectiviteInfo: collectiviteAvecTypeSchema,
    date: z.string().datetime(),
    scores: actionWithScoreFinalSchema,
    jalon: z.nativeEnum(SnapshotJalon),
    auditId: z.number().optional(),
    anneeAudit: z.number().optional(),
    snapshot: getReferentielScoresResponseSnapshotInfoSchema.optional(),
    mode: z.nativeEnum(ComputeScoreMode),
  })
  .describe('Score de la collectivité pour un référentiel et la date donnée');

export type GetReferentielScoresResponseType = z.infer<
  typeof getReferentielScoresResponseSchema
>;
