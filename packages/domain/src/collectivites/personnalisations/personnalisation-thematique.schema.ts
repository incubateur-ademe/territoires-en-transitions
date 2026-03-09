import { referentielIdEnumSchema } from '@tet/domain/referentiels';
import * as z from 'zod/mini';

export const personnalisationThematiqueSchema = z.object({
  id: z.string(),
  nom: z.string(),
  isComplete: z.boolean(),
  questionsCount: z.number(),
  reponsesCount: z.number(),
  referentiels: z.array(referentielIdEnumSchema),
});

export type PersonnalisationThematique = z.infer<
  typeof personnalisationThematiqueSchema
>;
