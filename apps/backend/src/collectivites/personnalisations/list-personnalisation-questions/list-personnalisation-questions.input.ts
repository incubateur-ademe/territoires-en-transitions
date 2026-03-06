import { z } from 'zod';

export const listPersonnalisationQuestionsInputSchema = z
  .object({
    actionIds: z.array(z.string()).optional(),
    thematiqueId: z.string().optional(),
    questionIds: z.array(z.string()).optional(),
  })
  .optional();

export type ListPersonnalisationQuestionsInput = z.infer<
  typeof listPersonnalisationQuestionsInputSchema
>;
