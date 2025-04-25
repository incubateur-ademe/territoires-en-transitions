import { z } from 'zod';

/** @deprecated Use personneTagOrUserSchema from backend instead */
export const personneSchema = z.object({
  nom: z.string().nullish(),
  collectiviteId: z.number().nullable(),
  tagId: z.number().nullish(),
  userId: z.string().nullish(),
  // TODO remove this field ?
  idTablePassage: z.number().nullable().optional(),
});

/** @deprecated Use PersonneTagOrUser from backend instead */
export type Personne = z.input<typeof personneSchema>;
