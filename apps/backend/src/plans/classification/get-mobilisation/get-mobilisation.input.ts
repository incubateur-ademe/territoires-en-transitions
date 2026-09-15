import { z } from 'zod';

export const getMobilisationInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
});

export type GetMobilisationInput = z.output<typeof getMobilisationInputSchema>;
