import * as z from 'zod';

export const bibliothequeFichierSchema = z.object({
  id: z.number(),
  collectiviteId: z.nullable(z.number()),
  hash: z.nullable(z.string()),
  filename: z.nullable(z.string()),
  confidentiel: z.nullable(z.boolean()),
});

export type BibliothequeFichier = z.infer<typeof bibliothequeFichierSchema>;

export const bibliothequeFichierSchemaCreate = z.object({
  collectiviteId: z.number().int().positive(),
  hash: z.string().min(1),
  filename: z.string().min(1),
  confidentiel: z.optional(z.nullable(z.boolean())),
});

export type BibliothequeFichierCreate = z.infer<
  typeof bibliothequeFichierSchemaCreate
>;
