import { z } from 'zod';

export const getImportStatusInputSchema = z.object({
  jobId: z.string().uuid(),
});
