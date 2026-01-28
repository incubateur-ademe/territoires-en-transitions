import { z } from 'zod';
export const deleteBudgetsInputSchema = z.object({
  ficheId: z.number(),
  budgetsIds: z.array(z.number()),
});
