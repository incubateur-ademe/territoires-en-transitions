import { z } from 'zod';

export const listDemarchesPcaetInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
});

export type ListDemarchesPcaetInput = z.infer<
  typeof listDemarchesPcaetInputSchema
>;
