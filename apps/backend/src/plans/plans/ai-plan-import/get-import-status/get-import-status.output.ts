import { z } from 'zod';
import { aiPlanImportJobStatusSchema } from '../models/ai-plan-import-job.table';
import { extractedActionSchema } from '../models/extracted-action';

const stepStateSchema = z.enum(['ok', 'skipped', 'pending']);

const stepStatesSchema = z.object({
  extraction: stepStateSchema,
  scoring: stepStateSchema,
  consolidation: stepStateSchema,
  enrichment: stepStateSchema,
  qualitativeReview: stepStateSchema,
});

const planDraftSchema = z.object({
  actions: z.array(extractedActionSchema),
  qualitativeReview: z.string().nullable(),
});

export const getImportStatusOutputSchema = z.object({
  jobId: z.string(),
  status: aiPlanImportJobStatusSchema,
  stepStates: stepStatesSchema,
  draft: planDraftSchema.nullable(),
  error: z.string().nullable(),
});

export type GetImportStatusOutput = z.output<typeof getImportStatusOutputSchema>;
