import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { collectiviteAvecTypeSchema } from '../../collectivites/models/identite-collectivite.dto';
import { ComputeScoreMode } from './compute-scores-mode.enum';
import { referentielActionAvecScoreDtoSchema } from './referentiel-action-avec-score.dto';
import { ScoreJalon } from './score-jalon.enum';

export const getReferentielScoresResponseSchema = extendApi(
  z.object({
    collectiviteId: z.number(),
    referentielVersion: z.string(),
    collectiviteInfo: collectiviteAvecTypeSchema,
    date: z.string().datetime().optional(),
    scores: referentielActionAvecScoreDtoSchema,
    jalon: z.nativeEnum(ScoreJalon),
    auditId: z.number().optional(),
    anneeAudit: z.number().optional(),
    mode: z.nativeEnum(ComputeScoreMode),
  })
).openapi({
  title: 'Score de la collectivité pour un référentiel et la date donnée',
});
export type GetReferentielScoresResponseType = z.infer<
  typeof getReferentielScoresResponseSchema
>;
