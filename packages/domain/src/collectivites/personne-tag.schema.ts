import * as z from 'zod/mini';

export const personneTagSchema = z.object({
  id: z.number(),
  nom: z.string(),
  collectiviteId: z.number(),
});

export type PersonneTag = z.infer<typeof personneTagSchema>;

export const personneTagCreateSchema = z.object({
  id: z.optional(z.number()),
  nom: z.string(),
  collectiviteId: z.number(),
});

export type PersonneTagCreate = z.infer<typeof personneTagCreateSchema>;
