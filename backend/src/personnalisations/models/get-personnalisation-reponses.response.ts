import { z } from 'zod';

export const getPersonnalitionReponsesResponseSchema = z
  .record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]))
  .describe('Reponses aux questions de personnalisation');
export type GetPersonnalisationReponsesResponseType = z.infer<
  typeof getPersonnalitionReponsesResponseSchema
>;
