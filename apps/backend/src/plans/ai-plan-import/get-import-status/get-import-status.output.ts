import { z } from 'zod';
import { stepStatesSchema } from '../pipeline/run-import-pipeline';
import {
  aiPlanImportJobStatusSchema,
  importRetryDefaultsSchema,
} from '../models/ai-plan-import-job';
import { aiPlanImportProfileSchema } from '../models/import-profile';
import { importReportSchema } from '../models/import-report';
import {
  actionLevelDoubtSchema,
  actionLevelSchema,
} from '../models/import-question';

/** La question telle que l'écran la pose ; la réponse sans qui l'a donnée. */
const importQuestionOutputSchema = actionLevelDoubtSchema.extend({
  answer: z.object({ actionLevel: actionLevelSchema }).nullable(),
});

const importContentOutputSchema = z.object({
  axes: z.number().int().nonnegative(),
  sousAxes: z.number().int().nonnegative(),
  actions: z.number().int().nonnegative(),
  sousActions: z.number().int().nonnegative(),
});

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
  /** La précision demandée après la lecture, et le choix fait. */
  question: importQuestionOutputSchema.nullable(),
  /** Le plan créé, compté : absent des imports antérieurs et d'Électrification. */
  content: importContentOutputSchema.nullable(),
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
