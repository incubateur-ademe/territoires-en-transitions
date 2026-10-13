import { z } from 'zod';

export const recetteCollectiviteSchema = z.object({
  tecCollectiviteId: z.number().int(),
  collectiviteId: z.number().int().nullable(),
  nom: z.string(),
  siren: z.string().nullable(),
  population: z.number().int().nullable(),
  nomTet: z.string().nullable(),
  region: z.string().nullable(),
  departement: z.string().nullable(),
});

export type RecetteCollectivite = z.infer<typeof recetteCollectiviteSchema>;
