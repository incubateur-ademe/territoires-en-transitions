import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { actionScoreSchema } from './action-score.dto';

export const actionPointScoreSchema = extendApi(
  actionScoreSchema.pick({
    point_fait: true,
    point_non_renseigne: true,
    point_pas_fait: true,
    point_potentiel: true,
    point_programme: true,
    point_referentiel: true,
  })
);
export type ActionPointScoreType = z.infer<typeof actionPointScoreSchema>;
