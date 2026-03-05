import { z } from 'zod';

export const getPersonnalisationReponsesInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  questionIds: z.array(z.string().min(1)).optional(),
});

export type GetPersonnalisationReponsesInput = z.infer<
  typeof getPersonnalisationReponsesInputSchema
>;
