import { z } from 'zod';

export const listCollectivitesSuiviesInputSchema = z.object({
  /** Le service instructeur dont on liste le territoire. */
  collectiviteId: z.number().int().positive(),
});

export type ListCollectivitesSuiviesInput = z.infer<
  typeof listCollectivitesSuiviesInputSchema
>;
