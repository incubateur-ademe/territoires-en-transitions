import { z } from 'zod';

export const getImportStatusInputSchema = z.object({
  jobId: z.string().uuid(),
});

export const getCurrentImportInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
});
