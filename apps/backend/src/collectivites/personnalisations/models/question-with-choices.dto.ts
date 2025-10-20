import z from 'zod';
import { questionChoixSchema } from './question-choix.table';
import { questionSchema } from './question.table';

export const questionWithChoicesSchema = questionSchema.extend({
  thematiqueNom: z.string().optional().nullable(),
  choix: questionChoixSchema
    .omit({ questionId: true, version: true })
    .array()
    .optional()
    .nullable(),
});

export type QuestionWithChoices = z.infer<typeof questionWithChoicesSchema>;
