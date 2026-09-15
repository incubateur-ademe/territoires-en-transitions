import * as z from 'zod/mini';
import { createEnumObject } from '../../utils/enum.utils';
import type { IndicateurPeriodicite } from './indicateur-periodicite.schema';

export const indicateurPeriodiciteModeValues = [
  'recommandee',
  'imposee',
] as const;

export const IndicateurPeriodiciteModeEnum = createEnumObject(
  indicateurPeriodiciteModeValues
);

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
  return definition.periodiciteMode === IndicateurPeriodiciteModeEnum.IMPOSEE
    ? definition.periodicite
    : personnalisee ?? definition.periodicite;
}

export function canCustomizeIndicateurPeriodicite(
  mode: IndicateurPeriodiciteMode
): boolean {
  return mode === IndicateurPeriodiciteModeEnum.RECOMMANDEE;
}
