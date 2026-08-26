import { z } from 'zod';

export const listPlansInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
});

export type ListPlansInput = z.infer<typeof listPlansInputSchema>;
