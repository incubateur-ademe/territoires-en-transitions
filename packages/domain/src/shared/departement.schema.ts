import * as z from 'zod/mini';

export const departementSchema = z.object({
  code: z.string(),
  population: z.number(),
  libelle: z.string(),
  regionCode: z.string(),
});

export type Departement = z.infer<typeof departementSchema>;
