import {
  budgetTypeSchema,
  budgetUniteSchema,
} from '@/backend/plans/fiches/fiche-action-budget/budget.types';
import { z } from 'zod';

export const getBudgetsRequestSchema = z.object({
  ficheId: z.number(),
  type: budgetTypeSchema.optional(),
  unite: budgetUniteSchema.optional(),
  total: z.boolean().optional(),
});

export type getBudgetsRequest = z.infer<typeof getBudgetsRequestSchema>;
