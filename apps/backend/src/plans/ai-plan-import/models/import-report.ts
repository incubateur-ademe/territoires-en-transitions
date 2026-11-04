import { z } from 'zod';

export const importReportSchema = z.object({
  issues: z.array(
    z.object({
      kind: z.enum([
        'document-error',
        'configuration-error',
        'processing-error',
        'warning',
        'preserved-data',
      ]),
      code: z.string(),
      message: z.string(),
      location: z.string().optional(),
    })
  ),
  qualitativeReview: z.string().nullable(),
});

export type ImportReport = z.output<typeof importReportSchema>;
