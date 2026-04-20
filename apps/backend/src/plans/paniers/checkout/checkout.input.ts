import { z } from 'zod';

export const checkoutInputSchema = z.object({
  collectiviteId: z.number().positive(),
  panierId: z.string().uuid(),
  planId: z.number().positive().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;
