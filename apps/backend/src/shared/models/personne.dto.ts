import z from 'zod';

/*
 * Schémas pour une personne ou un ID de personne
 */

export const personneIdSchema = z.object({
  tagId: z.number().nullish(),
  userId: z.uuid().nullish(),
});
export type PersonneId = z.infer<typeof personneIdSchema>;

export const personneSchema = personneIdSchema.extend({
  tagName: z.string().nullish(),
  userName: z.string().nullish(),
});
export type Personne = z.infer<typeof personneSchema>;
