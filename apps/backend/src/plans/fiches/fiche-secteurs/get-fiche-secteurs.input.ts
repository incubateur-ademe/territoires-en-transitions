import { z } from 'zod';

export const getFicheSecteursInputSchema = z.object({
  ficheId: z.number().int().positive(),
});

export type GetFicheSecteursInput = z.infer<typeof getFicheSecteursInputSchema>;
