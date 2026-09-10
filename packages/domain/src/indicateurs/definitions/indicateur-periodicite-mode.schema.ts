import * as z from 'zod/mini';
import type { IndicateurPeriodicite } from './indicateur-periodicite.schema';

export const indicateurPeriodiciteModeValues = [
  'recommandee',
  'imposee',
] as const;
export const indicateurPeriodiciteModeSchema = z.enum(
  indicateurPeriodiciteModeValues
);
export type IndicateurPeriodiciteMode = z.infer<
  typeof indicateurPeriodiciteModeSchema
>;

/** Resolves the local tracking cadence without changing the catalogue definition. */
export function getEffectiveIndicateurPeriodicite(
  definition: {
    periodicite: IndicateurPeriodicite;
    periodiciteMode: IndicateurPeriodiciteMode;
  },
  personnalisee?: IndicateurPeriodicite | null
): IndicateurPeriodicite {
  return definition.periodiciteMode === 'imposee'
    ? definition.periodicite
    : personnalisee ?? definition.periodicite;
}

export function canCustomizeIndicateurPeriodicite(
  mode: IndicateurPeriodiciteMode
): boolean {
  return mode === 'recommandee';
}
