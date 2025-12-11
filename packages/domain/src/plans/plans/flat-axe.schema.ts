import * as z from 'zod/mini';

export const flatAxeSchema = z.object({
  id: z.number(),
  nom: z.nullable(z.string()),
  ancestors: z.array(z.number()),
  depth: z.number(),
  sort_path: z.string(),
  fiches: z.array(z.number()),
});

export type FlatAxe = z.infer<typeof flatAxeSchema>;

export type PlanNode = Omit<FlatAxe, 'ancestors' | 'sort_path'> & {
  parent: number | null;
};
