import * as z from 'zod/mini';

export const questionChoixSchema = z.object({
  id: z.string(),
  questionId: z.string(),
  ordonnancement: z.nullable(z.number()),
  formulation: z.nullable(z.string()),
  version: z.string(),
});

export type QuestionChoix = z.infer<typeof questionChoixSchema>;

export const questionChoixCreateSchema = z.partial(questionChoixSchema, {
  ordonnancement: true,
  formulation: true,
  version: true,
});

export type QuestionChoixCreate = z.infer<typeof questionChoixCreateSchema>;
