import { z } from 'zod';

export const listPlanFichesSecteursAVerifierInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  planId: z.number().int().positive(),
  /** Inclut aussi les fiches dont le secteur est attribué, avec leurs secteurs. */
  includeAttribues: z.boolean().optional(),
});

export type ListPlanFichesSecteursAVerifierInput = z.infer<
  typeof listPlanFichesSecteursAVerifierInputSchema
>;
