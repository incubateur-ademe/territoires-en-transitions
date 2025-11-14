import * as z from 'zod/mini';

export const actionQuestionSchema = z.object({
  actionId: z.string(),
  questionId: z.string(),
});

export type ActionQuestion = z.infer<typeof actionQuestionSchema>;
