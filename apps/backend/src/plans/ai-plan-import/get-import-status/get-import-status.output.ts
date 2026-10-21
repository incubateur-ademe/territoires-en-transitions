import { z } from 'zod';
import { stepStatesSchema } from '../pipeline/run-import-pipeline';
import { aiPlanImportJobStatusSchema } from '../models/ai-plan-import-job';

export const getImportStatusOutputSchema = z.object({
  jobId: z.string(),
  status: aiPlanImportJobStatusSchema,
  stepStates: stepStatesSchema,
  qualitativeReview: z.string().nullable(),
  error: z.string().nullable(),
  createdPlanId: z.number().nullable(),
  /** En échec avec un point de reprise : l'équipe peut le reprendre. */
  resumable: z.boolean(),
  /** Plan PCAET : l'étape des secteurs propose aussi les secteurs réglementaires. */
  withSecteurs: z.boolean(),
});

export type GetImportStatusOutput = z.output<typeof getImportStatusOutputSchema>;
