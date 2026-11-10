import { z } from 'zod';
import {
  auditPreuvesArchiveErrorCodeSchema,
  auditPreuvesArchiveStatusSchema,
} from '../models/audit-preuves-archive.table';

export const listPreuvesArchiveOutputSchema = z.array(
  z.object({
    archiveId: z.string().uuid(),
    status: auditPreuvesArchiveStatusSchema,
    totalFiles: z.number().int().nonnegative(),
    processedFiles: z.number().int().nonnegative(),
    createdAt: z.string(),
    errorCode: auditPreuvesArchiveErrorCodeSchema.nullable(),
  })
);

export type ListPreuvesArchiveOutput = z.infer<
  typeof listPreuvesArchiveOutputSchema
>;
