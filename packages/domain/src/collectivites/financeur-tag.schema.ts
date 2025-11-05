import z from 'zod';

export const financeurTagSchema = z.object({
  id: z.number(),
  nom: z.string(),
  collectiviteId: z.number(),
});

export type FinanceurTag = z.infer<typeof financeurTagSchema>;

