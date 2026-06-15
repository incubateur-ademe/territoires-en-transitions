import { z } from 'zod';
import { stepStatesSchema } from '../generate-import-draft/run-import-pipeline';
import { aiPlanImportJobStatusSchema } from '../models/ai-plan-import-job';

export const getImportStatusOutputSchema = z.object({
  jobId: z.string(),
  status: aiPlanImportJobStatusSchema,
  stepStates: stepStatesSchema,
  qualitativeReview: z.string().nullable(),
  error: z.string().nullable(),
  createdPlanId: z.number().nullable(),
});

export type GetImportStatusOutput = z.output<typeof getImportStatusOutputSchema>;
