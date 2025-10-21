import { z } from 'zod';

export const getPersonnalisationReponsesRequestSchema = z
  .object({
    date: z.iso.datetime().optional(),
  })
  .describe(
    'Paramètres de la requête pour obtenir les réponses aux questions de personnalisation'
  );
export type GetPersonnalisationReponsesRequestType = z.infer<
  typeof getPersonnalisationReponsesRequestSchema
>;
