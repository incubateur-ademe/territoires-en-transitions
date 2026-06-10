import { z } from 'zod';

export const duplicatePlanInputSchema = z.object({
  planId: z.number().positive("L'ID du plan doit être positif"),
  nom: z
    .string()
    .trim()
    .min(1, 'Le nom du plan est requis')
    .max(300, 'Le nom du plan ne doit pas dépasser 300 caractères'),
});

export type DuplicatePlanInput = z.infer<typeof duplicatePlanInputSchema>;
