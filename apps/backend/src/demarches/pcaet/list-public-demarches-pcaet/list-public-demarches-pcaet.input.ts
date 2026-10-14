import { z } from 'zod';

export const listPublicDemarchesPcaetInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
});

export type ListPublicDemarchesPcaetInput = z.infer<
  typeof listPublicDemarchesPcaetInputSchema
>;
