import { z } from 'zod';

export const statSchema = z.object({
  value: z
    .number()
    .int()
    .nonnegative()
    .describe('Nombre de fiches action créées sur la période (non cumulé).'),
  date: z
    .number()
    .int()
    .describe('Début de la période, en timestamp UTC (millisecondes).'),
});

export type Stat = z.infer<typeof statSchema>;

export const getStatsOutputSchema = z.object({
  description: z.string(),
  stats: z.array(statSchema),
});

export type GetStatsOutput = z.infer<typeof getStatsOutputSchema>;
