import { z } from 'zod';

export const getImportStatusInputSchema = z.object({
  jobId: z.string().uuid(),
});

export const getCurrentImportInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
});

export const listRecentImportsInputSchema = getCurrentImportInputSchema.extend({
  limit: z.number().int().min(1).max(50).default(20),
  cursor: z.string().uuid().optional(),
});

export type ListRecentImportsInput = z.output<
  typeof listRecentImportsInputSchema
>;
