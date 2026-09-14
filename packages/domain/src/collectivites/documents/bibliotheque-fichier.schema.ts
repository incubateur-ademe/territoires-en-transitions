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

export const legacyDocumentHashSchema = z
  .string()
  .max(160)
  .regex(
    /^(?!\.{1,2}$)[^\s/\\%](?:[^/\\%]*[^\s/\\%])?$/,
    'Le hash hérité est un nom de fichier sans séparateur de chemin, sans « % », ni espace en bordure, ni « . » ou « .. » seul'
  )
  .brand<'LegacyDocumentHash'>();

export type LegacyDocumentHash = z.infer<typeof legacyDocumentHashSchema>;

export const storedDocumentHashSchema = z.union([
  documentHashSchema,
  legacyDocumentHashSchema,
]);

export type StoredDocumentHash = z.infer<typeof storedDocumentHashSchema>;

export const bibliothequeFichierSchema = z.object({
  id: z.number(),
  collectiviteId: z.number(),
  hash: storedDocumentHashSchema,
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
