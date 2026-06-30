import z from 'zod';

export const personalMetricsOutputSchema = z.object({
  plans: z.object({
    piloteFichesCount: z.number(),
    piloteSubFichesCount: z.number(),
    piloteFichesIndicateursCount: z.number(),
  }),
  indicateurs: z.object({
    piloteCount: z.number(),
  }),
  referentiels: z.object({
    piloteMesuresCount: z.number(),
  }),
});

export type PersonalMetricsOutput = z.infer<typeof personalMetricsOutputSchema>;
