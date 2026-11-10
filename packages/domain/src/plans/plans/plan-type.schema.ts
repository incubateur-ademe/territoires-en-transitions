import * as z from 'zod/mini';

// Le couple (categorie, type) est unique en base ; les IDs dépendent de l'environnement.
export const ELECTRIFICATION_PLAN_TYPE_KEY = {
  categorie: 'Plans thématiques',
  type: 'Plan Électrification',
} as const;

export const planTypeSchema = z.object({
  id: z.number(),
  categorie: z.string(),
  type: z.string(),
  detail: z.nullable(z.string()),
});

export type PlanType = z.infer<typeof planTypeSchema>;
