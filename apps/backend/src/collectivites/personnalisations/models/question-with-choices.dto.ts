import { questionChoixSchema, questionSchema } from '@tet/domain/collectivites';
import * as z from 'zod/mini';

export const questionWithChoicesSchema = z.object({
  ...questionSchema.shape,

  actionIds: z.nullish(z.array(z.string())),
  referentielIds: z.nullish(z.array(z.string())),
  thematiqueNom: z.nullish(z.string()),
  choix: z.nullish(
    z.array(z.omit(questionChoixSchema, { questionId: true, version: true }))
  ),
});

export type QuestionWithChoices = z.infer<typeof questionWithChoicesSchema>;
