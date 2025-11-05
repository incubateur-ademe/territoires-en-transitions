import * as z from 'zod/mini';

export const referentielTagSchema = z.object({
  ref: z.string(),
  nom: z.string(),
  type: z.string(),
});

export type ReferentielTag = z.infer<typeof referentielTagSchema>;
