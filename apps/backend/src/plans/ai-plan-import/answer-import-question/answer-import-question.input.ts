import { z } from 'zod';
import { importChoicesSchema } from '../models/import-question';

/** Un choix par doute posé, envoyés ensemble. */
export const answerImportQuestionInputSchema = z.object({
  jobId: z.string().uuid(),
  choices: importChoicesSchema,
});

export type AnswerImportQuestionInput = z.infer<
  typeof answerImportQuestionInputSchema
>;
