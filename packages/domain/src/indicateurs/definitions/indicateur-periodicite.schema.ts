import * as z from 'zod/mini';

export const indicateurPeriodiciteValues = ['annuelle', 'mensuelle'] as const;

export const indicateurPeriodiciteSchema = z.enum(indicateurPeriodiciteValues);

export type IndicateurPeriodicite = z.infer<typeof indicateurPeriodiciteSchema>;
