import { z } from 'zod';

export const listPlanFichesSecteursAVerifierInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  planId: z.number().int().positive(),
});

export type ListPlanFichesSecteursAVerifierInput = z.infer<
  typeof listPlanFichesSecteursAVerifierInputSchema
>;
