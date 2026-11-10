import { z } from 'zod';
import { stepStatesSchema } from '../pipeline/run-import-pipeline';
import {
  aiPlanImportJobStatusSchema,
  importRetryDefaultsSchema,
} from '../models/ai-plan-import-job';
import { aiPlanImportProfileSchema } from '../models/import-profile';
import { importReportSchema } from '../models/import-report';

export const getImportStatusOutputSchema = z.object({
  jobId: z.string(),
  planName: z.string().nullable(),
  profile: aiPlanImportProfileSchema.nullable(),
  createdAt: z.string(),
  finishedAt: z.string().nullable(),
  status: aiPlanImportJobStatusSchema,
  stepStates: stepStatesSchema,
  qualitativeReview: z.string().nullable(),
  error: z.string().nullable(),
  createdPlanId: z.number().nullable(),
  /** En échec avec un point de reprise : l'équipe peut le reprendre. */
  resumable: z.boolean(),
  /** Plan PCAET : l'étape des secteurs propose aussi les secteurs réglementaires. */
  withSecteurs: z.boolean(),
  report: importReportSchema,
  /** Disponible sur le détail uniquement, pas dans la liste des imports. */
  retryDefaults: importRetryDefaultsSchema.nullable().optional(),
});

export type GetImportStatusOutput = z.output<
  typeof getImportStatusOutputSchema
>;

export const listRecentImportsOutputSchema = z.object({
  items: z.array(getImportStatusOutputSchema),
  nextCursor: z.string().uuid().nullable(),
});

export type ListRecentImportsOutput = z.output<
  typeof listRecentImportsOutputSchema
>;
