import { z } from 'zod';

export const getPublicDemarchePcaetInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
});

export type GetPublicDemarchePcaetInput = z.infer<
  typeof getPublicDemarchePcaetInputSchema
>;
