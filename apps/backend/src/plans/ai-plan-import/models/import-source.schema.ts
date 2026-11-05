import { z } from 'zod';

/** Clé documentaire et localisation utilisées pour les liens et diagnostics. */
export const importSourceSchema = z.object({
  key: z.string().trim().min(1),
  location: z.string().trim().min(1),
});

export type ImportSource = z.infer<typeof importSourceSchema>;
