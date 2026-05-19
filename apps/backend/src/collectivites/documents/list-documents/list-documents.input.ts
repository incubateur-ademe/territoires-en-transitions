import { z } from 'zod';

export const listDocumentsInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  filenameContains: z.string().trim().optional(),
  hashes: z.array(z.string()).max(100).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(100),
});

export type ListDocumentsInput = z.infer<typeof listDocumentsInputSchema>;
