import * as z from 'zod';

export const bibliothequeFichierSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
  hash: z.string(),
  filename: z.string(),
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
