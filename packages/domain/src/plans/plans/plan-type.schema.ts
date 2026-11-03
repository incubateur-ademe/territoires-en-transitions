import * as z from 'zod/mini';

// Les identifiants des types varient selon l’environnement.
export const ELECTRIFICATION_PLAN_TYPE = 'Plan Électrification';

export const planTypeSchema = z.object({
  id: z.number(),
  categorie: z.string(),
  type: z.string(),
  detail: z.nullable(z.string()),
});

export type PlanType = z.infer<typeof planTypeSchema>;
