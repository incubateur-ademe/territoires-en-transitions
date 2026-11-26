import { z } from 'zod';
import { modelDoubtMotifValues, readingStatsSchema } from './model-doubt';

/**
 * L'abandon motivé tel que l'écran l'explique : le motif, les passages
 * retrouvés dans le document, les mots du modèle. Absent des autres imports.
 */
export const importAbandonSchema = z.object({
  motif: z.enum(modelDoubtMotifValues),
  evidence: z.array(
    z.object({ citation: z.string(), page: z.number().int().positive() })
  ),
  explanation: z.string(),
  readingStats: readingStatsSchema.optional(),
});

export type ImportAbandon = z.output<typeof importAbandonSchema>;

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
  abandon: importAbandonSchema.optional(),
});

export type ImportReport = z.output<typeof importReportSchema>;
