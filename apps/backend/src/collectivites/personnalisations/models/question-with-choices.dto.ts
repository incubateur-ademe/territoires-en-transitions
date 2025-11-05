import { questionChoixSchema, questionSchema } from '@/domain/collectivites';
import * as z from 'zod/mini';

export const questionWithChoicesSchema = z.object({
  ...questionSchema.shape,

  thematiqueNom: z.nullish(z.string()),
  choix: z.nullish(
    z.array(z.omit(questionChoixSchema, { questionId: true, version: true }))
  ),
});

export type QuestionWithChoices = z.infer<typeof questionWithChoicesSchema>;
