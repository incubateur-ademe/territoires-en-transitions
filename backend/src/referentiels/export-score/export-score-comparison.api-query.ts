import z from 'zod';

export const exportScoreComparisonApiQuerySchema = z.object({
  snapshotReferences: z
    .string()
    .transform((value) => value.split(','))
    .optional(),
  isAudit: z
    .string()
    .transform((value) => value === 'true')
    .optional(),
});

export type ExportScoreComparisonApiQuery = z.infer<
  typeof exportScoreComparisonApiQuerySchema
>;
