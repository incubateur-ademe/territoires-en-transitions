import { z } from 'zod';
import {
  budgetTypeSchema,
  budgetUniteSchema
} from '@/backend/plans/fiches/fiche-action-budget/fiche-action-budget.table';

export const getBudgetsRequestSchema = z.object({
  ficheId : z.number(),
  type : budgetTypeSchema.optional(),
  unite : budgetUniteSchema.optional(),
  total : z.boolean().optional(),
});

export type getBudgetsRequest = z.infer<typeof getBudgetsRequestSchema>;
