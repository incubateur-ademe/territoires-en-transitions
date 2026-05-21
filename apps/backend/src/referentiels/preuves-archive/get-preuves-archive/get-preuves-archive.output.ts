import { z } from 'zod';
import { auditPreuvesArchiveStatusSchema } from '../models/audit-preuves-archive.table';

export const getPreuvesArchiveOutputSchema = z.object({
  archiveId: z.string().uuid(),
  status: auditPreuvesArchiveStatusSchema,
  totalFiles: z.number().int().nonnegative(),
  processedFiles: z.number().int().nonnegative(),
  downloadUrl: z.string().nullable(),
  errorMessage: z.string().nullable(),
});

export type GetPreuvesArchiveOutput = z.infer<
  typeof getPreuvesArchiveOutputSchema
>;
