import * as z from 'zod';

export const documentHashSchema = z
  .string()
  .regex(
    /^[0-9a-f]{64}$/,
    'Le hash doit être une empreinte SHA-256 en hexadécimal minuscule'
  )
  .brand<'DocumentHash'>();

export type DocumentHash = z.infer<typeof documentHashSchema>;

export const toDocumentHash = (hash: string): DocumentHash =>
  documentHashSchema.parse(hash);

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
  hash: documentHashSchema,
  filename: z.string().min(1),
  confidentiel: z.optional(z.nullable(z.boolean())),
});

export type BibliothequeFichierCreate = z.infer<
  typeof bibliothequeFichierSchemaCreate
>;
