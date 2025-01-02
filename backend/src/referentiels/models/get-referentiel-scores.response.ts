import { z } from 'zod';
import { collectiviteAvecTypeSchema } from '../../collectivites/identite-collectivite.dto';
import { ComputeScoreMode } from './compute-scores-mode.enum';
import { referentielActionAvecScoreDtoSchema } from './referentiel-action-avec-score.dto';
import { ReferentielType } from './referentiel.enum';
import { ScoreJalon } from './score-jalon.enum';

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
    referentielId: z.nativeEnum(ReferentielType),
    referentielVersion: z.string(),
    collectiviteInfo: collectiviteAvecTypeSchema,
    date: z.string().datetime(),
    scores: referentielActionAvecScoreDtoSchema,
    jalon: z.nativeEnum(ScoreJalon),
    auditId: z.number().optional(),
    anneeAudit: z.number().optional(),
    snapshot: getReferentielScoresResponseSnapshotInfoSchema.optional(),
    mode: z.nativeEnum(ComputeScoreMode),
  })
  .describe('Score de la collectivité pour un référentiel et la date donnée');
export type GetReferentielScoresResponseType = z.infer<
  typeof getReferentielScoresResponseSchema
>;
