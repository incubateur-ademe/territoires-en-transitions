import { z } from 'zod';

export const getDemarchePcaetInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
});

export type GetDemarchePcaetInput = z.infer<typeof getDemarchePcaetInputSchema>;
