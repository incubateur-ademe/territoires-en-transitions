import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';

export const getPersonnalitionReponsesResponseSchema = extendApi(
  z.record(
    z.string(),
    z.union([z.string(), z.number(), z.boolean(), z.null()]),
  ),
).openapi({
  description: 'Reponses aux questions de personnalisation',
  title: 'Reponses de personnalisation',
});
export type GetPersonnalisationReponsesResponseType = z.infer<
  typeof getPersonnalitionReponsesResponseSchema
>;
