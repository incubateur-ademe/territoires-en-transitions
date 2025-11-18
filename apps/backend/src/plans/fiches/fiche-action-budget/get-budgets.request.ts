import { budgetTypeSchema, budgetUniteSchema } from '@tet/domain/plans';
import { z } from 'zod';

export const getBudgetsRequestSchema = z.object({
  ficheId: z.number(),
  type: z.optional(budgetTypeSchema),
  unite: z.optional(budgetUniteSchema),
  total: z.boolean().optional(),
});

export type getBudgetsRequest = z.infer<typeof getBudgetsRequestSchema>;
