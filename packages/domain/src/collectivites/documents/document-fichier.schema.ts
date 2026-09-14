import { storedDocumentHashSchema } from './bibliotheque-fichier.schema';
import * as z from 'zod/mini';

export const fichierSchema = z.object({
  id: z.number(),
  filename: z.nullable(z.string()),
  confidentiel: z.nullable(z.boolean()),
  hash: z.nullable(storedDocumentHashSchema),
  bucketId: z.nullable(z.string()),
  filesize: z.nullable(z.number()),
});

export type FichierOutput = z.infer<typeof fichierSchema>;
