import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { actionScoreSchema } from './action-score.dto';

export const actionPointScoreSchema = extendApi(
  actionScoreSchema.pick({
    pointFait: true,
    pointNonRenseigne: true,
    pointPasFait: true,
    pointPotentiel: true,
    pointProgramme: true,
    pointReferentiel: true,
  })
);
export type ActionPointScoreType = z.infer<typeof actionPointScoreSchema>;
