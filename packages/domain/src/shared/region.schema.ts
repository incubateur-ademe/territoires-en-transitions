import * as z from 'zod/mini';

export const regionSchema = z.object({
  code: z.string(),
  population: z.number(),
  libelle: z.string(),
  drom: z.boolean(),
});

export type Region = z.infer<typeof regionSchema>;
