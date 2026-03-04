import * as z from 'zod';
import { referentielIdEnumSchema } from '../../referentiels/referentiel-id.enum';

export const questionThematiqueCompletudeSchema = z
  .object({
    collectiviteId: z.number(),
    id: z.string(),
    nom: z.string(),
    referentiels: z.array(referentielIdEnumSchema),
    completude: z.enum(['complete', 'a_completer']).nullable().optional(),
  })
  .transform(({ completude, ...rest }) => ({
    ...rest,
    isComplete: completude === 'complete',
  }));

export type QuestionThematiqueCompletude = z.infer<
  typeof questionThematiqueCompletudeSchema
>;
