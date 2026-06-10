import { z } from 'zod';

export const duplicateFicheInputSchema = z.object({
  ficheId: z.number().positive("L'ID de la fiche doit être positif"),
});

export type DuplicateFicheInput = z.infer<typeof duplicateFicheInputSchema>;
