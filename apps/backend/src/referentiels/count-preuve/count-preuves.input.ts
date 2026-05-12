import z from 'zod';

export const countPreuvesInputSchema = z.object({
  collectiviteId: z.number().int().positive(),
  actionId: z.string().min(1),
});

export type CountPreuvesInput = z.infer<typeof countPreuvesInputSchema>;
