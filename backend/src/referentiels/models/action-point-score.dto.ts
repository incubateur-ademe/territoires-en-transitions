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
    etoiles: true,
  })
);
export type ActionPointScoreType = z.infer<typeof actionPointScoreSchema>;

export const actionPointScoreWithAvancementSchema = extendApi(
  actionScoreSchema.pick({
    pointFait: true,
    pointNonRenseigne: true,
    pointPasFait: true,
    pointPotentiel: true,
    pointProgramme: true,
    pointReferentiel: true,
    etoiles: true,
    totalTachesCount: true,
    faitTachesAvancement: true,
    programmeTachesAvancement: true,
    pasFaitTachesAvancement: true,
    pasConcerneTachesAvancement: true,
  })
);
export type ActionPointScoreWithAvancementType = z.infer<
  typeof actionPointScoreWithAvancementSchema
>;
