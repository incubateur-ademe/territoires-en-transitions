import * as z from 'zod/mini';

export const fichierSchema = z.object({
  filename: z.nullable(z.string()),
  confidentiel: z.nullable(z.boolean()),
  hash: z.nullable(z.string()),
  bucketId: z.nullable(z.string()),
  filesize: z.nullable(z.number()),
});

export type FichierOutput = z.infer<typeof fichierSchema>;
