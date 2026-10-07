import { z } from 'zod';

export const dossierDocumentUrlSchema = z.object({
  url: z.string(),
  filename: z.string(),
});

export type DossierDocumentUrl = z.infer<typeof dossierDocumentUrlSchema>;
