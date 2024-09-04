import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

export const getPersonnalisationReponsesRequestSchema = extendApi(
  z.object({
    date: z.string().datetime().optional(),
  }),
).openapi({
  description:
    'Paramètres de la requête pour obtenir les réponses aux questions de personnalisation',
});
export type GetPersonnalisationReponsesRequestType = z.infer<
  typeof getPersonnalisationReponsesRequestSchema
>;
