import { z } from 'zod';

export const downloadAvisPiecesQuerySchema = z.object({
  demandeAvisId: z.coerce.number().int().positive(),
  avisId: z.string().uuid(),
});

export type DownloadAvisPiecesQuery = z.infer<
  typeof downloadAvisPiecesQuerySchema
>;
