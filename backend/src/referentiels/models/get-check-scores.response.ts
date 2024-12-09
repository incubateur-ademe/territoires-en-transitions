import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { actionScoreSchema } from '../../../../packages/domain/src/referentiels/models/action-score.dto';
import { CheckScoreStatus } from '../../../../packages/domain/src/referentiels/models/check-score-status.enum';
import { ReferentielType } from '../../../../packages/domain/src/referentiels/models/referentiel.enum';

export const getCheckScoresResponseSchema = extendApi(
  z.object({
    collectiviteId: z.number(),
    referentielId: z.nativeEnum(ReferentielType),
    date: z.string().datetime(),
    verification_status: z.nativeEnum(CheckScoreStatus),
    differences: z.record(
      z.string(),
      z.object({
        calcule: actionScoreSchema.partial(),
        sauvegarde: actionScoreSchema.partial(),
      })
    ),
  })
).describe('Résultat de la vérification de calcul de score');
export type GetCheckScoresResponseType = z.infer<
  typeof getCheckScoresResponseSchema
>;
