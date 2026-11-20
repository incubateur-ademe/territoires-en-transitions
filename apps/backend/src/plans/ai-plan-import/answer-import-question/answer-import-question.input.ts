import { z } from 'zod';
import { importAnswerSchema } from '../models/import-question';

export const answerImportQuestionInputSchema = z.object({
  jobId: z.string().uuid(),
  answer: importAnswerSchema,
});

export type AnswerImportQuestionInput = z.infer<
  typeof answerImportQuestionInputSchema
>;
