import { z } from 'zod';

export const listPersonnalisationReponsesRequestSchema = z
  .object({
    date: z.iso.datetime().optional(),
  })
  .describe(
    'Paramètres de la requête pour obtenir les réponses aux questions de personnalisation'
  );
export type ListPersonnalisationReponsesRequestType = z.infer<
  typeof listPersonnalisationReponsesRequestSchema
>;
