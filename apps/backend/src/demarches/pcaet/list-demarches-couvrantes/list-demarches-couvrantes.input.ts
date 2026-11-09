import { z } from 'zod';

export const listDemarchesCouvrantesInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
});

export type ListDemarchesCouvrantesInput = z.infer<
  typeof listDemarchesCouvrantesInputSchema
>;
