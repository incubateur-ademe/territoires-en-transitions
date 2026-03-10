import { personnalisationThematiqueSchema } from '@tet/domain/collectivites';
import { z } from 'zod';

export const listThematiquesOutputSchema = z.object({
  thematiques: z.array(personnalisationThematiqueSchema),
  nbSuggestionsBanatic: z.int().nonnegative(),
});

export type ListThematiquesOutput = z.infer<typeof listThematiquesOutputSchema>;
