import { z } from 'zod';

export const planActionTypeSchema = z.object({
  id: z.number(),
  categorie: z.string(),
  type: z.string(),
  detail: z.string().nullable(),
});

export type PlanActionType = z.input<typeof planActionTypeSchema>;
