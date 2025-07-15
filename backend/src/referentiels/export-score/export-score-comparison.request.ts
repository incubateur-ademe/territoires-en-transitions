import z from 'zod';

export const exportScoreComparisonRequestSchema = z.object({
  exportFormat: z.enum(['excel', 'csv']),
  snapshotReferences: z
    .string()
    .transform((value) => value.split(','))
    .optional(),
  isAudit: z
    .string()
    .transform((value) => value === 'true')
    .optional(),
  isScoreIndicatifEnabled: z
    .string()
    .transform((value) => value === 'true')
    .optional(),
});

export type ExportScoreComparisonRequestQuery = z.infer<
  typeof exportScoreComparisonRequestSchema
>;
