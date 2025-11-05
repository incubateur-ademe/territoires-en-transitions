import * as z from 'zod/mini';

export const thematiqueSchema = z.object({
  id: z.number(),
  nom: z.string(),
});

export const thematiqueSchemaCreate = z.object({
  nom: z.string(),
  mdId: z.optional(z.nullable(z.string())),
});

export type Thematique = z.infer<typeof thematiqueSchema>;
export type ThematiqueCreate = z.infer<typeof thematiqueSchemaCreate>;
