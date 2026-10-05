import { z } from 'zod';

export const planSecteursCountsSchema = z.object({
  planId: z.number(),
  enCoursDeCalcul: z.number(),
  aRenseigner: z.number(),
  nonAttribuables: z.number(),
});

export type PlanSecteursCounts = z.infer<typeof planSecteursCountsSchema>;

export const listPlanSecteursCountsOutputSchema = z.array(
  planSecteursCountsSchema
);

export type ListPlanSecteursCountsOutput = z.infer<
  typeof listPlanSecteursCountsOutputSchema
>;
