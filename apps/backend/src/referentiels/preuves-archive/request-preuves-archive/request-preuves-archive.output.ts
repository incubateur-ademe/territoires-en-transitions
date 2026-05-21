import { z } from 'zod';
import { auditPreuvesArchiveStatusSchema } from '../models/audit-preuves-archive.table';

export const requestPreuvesArchiveOutputSchema = z.object({
  archiveId: z.string().uuid(),
  status: auditPreuvesArchiveStatusSchema,
});

export type RequestPreuvesArchiveOutput = z.infer<
  typeof requestPreuvesArchiveOutputSchema
>;
