import * as z from 'zod/mini';

export const planTypeSchema = z.object({
  id: z.number(),
  categorie: z.string(),
  type: z.string(),
  detail: z.nullable(z.string()),
});

export type PlanType = z.infer<typeof planTypeSchema>;
