import { z } from 'zod';

export const countPreuvesActionCountSchema = z.object({
  actionId: z.string(),
  count: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

export const countPreuvesOutputSchema = z.object({
  total: z.number().int().nonnegative(),
  children: z.array(countPreuvesActionCountSchema),
});

export type CountPreuvesOutput = z.infer<typeof countPreuvesOutputSchema>;
