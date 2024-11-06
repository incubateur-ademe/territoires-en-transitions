import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { referentielActionAvecScoreDtoSchema } from './referentiel-action-avec-score.dto';
import { ScoreJalon } from './score-jalon.enum';
import { collectiviteAvecTypeSchema } from '../../collectivites/models/identite-collectivite.dto';
import { referentielSchema } from '../../../../packages/api/src/referentiel/domain/enum.schema';

export const getReferentielScoresResponseSchema = extendApi(
  z.object({
    collectiviteId: z.number(),
    referentielVersion: z.string(),
    collectiviteInfo: collectiviteAvecTypeSchema.optional(),
    date: z.string().datetime().optional(),
    scores: referentielActionAvecScoreDtoSchema,
    jalon: z.nativeEnum(ScoreJalon),
    auditId: z.number().optional(),
    anneeAudit: z.number().optional(),
  })
).openapi({
  title: 'Score de la collectivité pour un référentiel et la date donnée',
});
export type GetReferentielScoresResponseType = z.infer<
  typeof getReferentielScoresResponseSchema
>;
