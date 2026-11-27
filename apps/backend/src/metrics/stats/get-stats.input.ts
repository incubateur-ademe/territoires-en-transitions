import { z } from 'zod';

export const statsPeriodicities = ['day', 'week', 'month', 'year'] as const;

export const statsPeriodicitySchema = z.enum(statsPeriodicities);

export type StatsPeriodicity = z.infer<typeof statsPeriodicitySchema>;

/** Borne haute de `since` : 10 ans de points journaliers, pour garder une
 * réponse de taille raisonnable. */
export const STATS_SINCE_MAX = 3660;

export const getStatsInputSchema = z.object({
  since: z.coerce
    .number()
    .int()
    .positive()
    .max(STATS_SINCE_MAX)
    .optional()
    .describe(
      'Nombre de périodes renvoyées, période en cours comprise. Par défaut : tout l’historique.'
    ),
  periodicity: statsPeriodicitySchema
    .default('month')
    .describe('Taille de la période. Par défaut : month.'),
});

export type GetStatsInput = z.infer<typeof getStatsInputSchema>;
