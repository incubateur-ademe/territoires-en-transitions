import { z } from 'zod';

export const listAvisRecusInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  demarcheId: z.number().int().positive(),
});

export type ListAvisRecusInput = z.infer<typeof listAvisRecusInputSchema>;
