import { z } from 'zod';

export const listPersonnalisationReponsesInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  questionIds: z.array(z.string().min(1)).optional(),
});

export type ListPersonnalisationReponsesInput = z.infer<
  typeof listPersonnalisationReponsesInputSchema
>;
