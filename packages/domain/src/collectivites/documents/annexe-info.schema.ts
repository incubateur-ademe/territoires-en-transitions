import * as z from 'zod/mini';

export const annexeInfoSchema = z.object({
  id: z.number(),
  modifiedAt: z.nullable(z.string()),
  modifiedByNom: z.nullable(z.string()),
  commentaire: z.nullable(z.string()),
  filename: z.nullable(z.string()),
  titre: z.nullable(z.string()),
  url: z.nullable(z.string()),
});

export type AnnexeInfo = z.infer<typeof annexeInfoSchema>;
