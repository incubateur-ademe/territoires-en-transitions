import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

export const getReferentielScoresRequestSchema = extendApi(
  z.object({
    date: z.string().datetime().optional(),
  }),
).openapi({
  title:
    'Paramètres de la requête pour obtenir les scores des actions dun référentiel',
});
export type GetReferentielScoresRequestType = z.infer<
  typeof getReferentielScoresRequestSchema
>;
