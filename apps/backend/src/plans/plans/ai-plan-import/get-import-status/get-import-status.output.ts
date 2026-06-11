import { z } from 'zod';
import { stepStatesSchema } from '../generate-import-draft/run-import-pipeline';
import { aiPlanImportJobStatusSchema } from '../models/ai-plan-import-job';
import { extractedActionSchema } from '../models/extracted-action';

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
