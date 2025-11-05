import * as z from 'zod/mini';

export const bibliothequeFichierSchema = z.object({
  id: z.nullable(z.number()),
  collectiviteId: z.nullable(z.number()),
  hash: z.nullable(z.string()),
  filename: z.nullable(z.string()),
  confidentiel: z.nullable(z.boolean()),
});

export type BibliothequeFichier = z.infer<typeof bibliothequeFichierSchema>;
