import { z } from 'zod';

export const getImportStatusInputSchema = z.object({
  jobId: z.string().uuid(),
});

export type GetImportStatusInput = z.output<typeof getImportStatusInputSchema>;
