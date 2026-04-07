import { referentielIdEnumSchema } from '@tet/domain/referentiels';
import { z } from 'zod';

const listPersonnalisationQuestionsFiltersSchema = z.object({
  actionIds: z.array(z.string().min(1)).optional(),
  collectiviteId: z.number().int().positive().optional(),
  referentielIds: z.array(referentielIdEnumSchema).optional(),
  thematiqueIds: z.array(z.string().min(1)).optional(),
  questionIds: z.array(z.string().min(1)).optional(),
});

export type ListPersonnalisationQuestionsFilters = z.infer<
  typeof listPersonnalisationQuestionsFiltersSchema
>;

const personnalisationQuestionsModeSchema = z.enum([
  'questions',
  'withReponses',
  'reponsesOnly',
]);

/**
 * `mode` est optionnel : défaut `questions` (liste des définitions sans réponses).
 */
export const listPersonnalisationQuestionsInputSchema = z
  .object({
    ...listPersonnalisationQuestionsFiltersSchema.shape,
    mode: personnalisationQuestionsModeSchema.optional().default('questions'),
    withEmptyReponse: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      (data.mode === 'withReponses' || data.mode === 'reponsesOnly') &&
      data.collectiviteId === undefined
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'collectiviteId est requis pour ce mode',
        path: ['collectiviteId'],
      });
    }
  });

export type ListPersonnalisationQuestionsInput = z.infer<
  typeof listPersonnalisationQuestionsInputSchema
>;
