import { referentielIdEnumSchema } from '@tet/domain/referentiels';
import { z } from 'zod';

export const listPersonnalisationQuestionsInputSchema = z
  .object({
    actionIds: z.array(z.string()).optional(),
    collectiviteId: z.number().optional(),
    referentielIds: z.array(referentielIdEnumSchema).optional(),
    thematiqueIds: z.array(z.string().min(1)).optional(),
    questionIds: z.array(z.string()).optional(),
  })
  .optional();

export type ListPersonnalisationQuestionsInput = z.infer<
  typeof listPersonnalisationQuestionsInputSchema
>;
