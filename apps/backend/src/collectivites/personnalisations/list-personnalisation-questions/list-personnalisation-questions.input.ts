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

export const listPersonnalisationQuestionsInputSchema =
  listPersonnalisationQuestionsFiltersSchema.extend({
    collectiviteId: z.number().int().positive(),
  });

export type ListPersonnalisationQuestionsInput = z.infer<
  typeof listPersonnalisationQuestionsInputSchema
>;
