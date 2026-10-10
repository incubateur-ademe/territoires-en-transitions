import {
  IndicateurPeriodiciteEnum,
  type IndicateurPeriodicite,
} from '../definitions/indicateur-periodicite.schema';
import { IndicateurPeriods } from './indicateur-period';
import {
  createIndicateurPeriodError,
  IndicateurPeriodErrorEnum,
} from './indicateur-period.errors';

/**
 * Explicit boundary for legacy capabilities whose business contract is an
 * annual series. Other periodicities are rejected: display aggregation is not
 * supported and cannot provide an annual observation.
 */
export function assertAnnualIndicateurPeriodicite(
  periodicite: IndicateurPeriodicite | null | undefined,
  capability: string
): asserts periodicite is typeof IndicateurPeriodiciteEnum.ANNUELLE {
  if (periodicite !== IndicateurPeriodiciteEnum.ANNUELLE) {
    throw createIndicateurPeriodError({
      code: IndicateurPeriodErrorEnum.INDICATEUR_ANNUAL_PERIODICITE_REQUIRED,
      details: { periodicite, capability },
    });
  }
}

export const toAnnualIndicateurYear = (
  periodicite: IndicateurPeriodicite | null | undefined,
  dateValeur: string,
  capability: string
): number => {
  assertAnnualIndicateurPeriodicite(periodicite, capability);
  return Number(
    IndicateurPeriods.serialize(
      IndicateurPeriods.fromDateValeur(periodicite, dateValeur)
    )
  );
};

/**
 * Compatibility adapter for immutable historical payloads written before
 * annual dates became canonical. New/current records must use
 * `toAnnualIndicateurYear`, which rejects a non-canonical storage date.
 */
export const toAnnualIndicateurYearFromHistoricalDate = (
  periodicite: IndicateurPeriodicite | null | undefined,
  dateValeur: string,
  capability: string
): number => {
  assertAnnualIndicateurPeriodicite(periodicite, capability);
  return Number(
    IndicateurPeriods.serialize(
      IndicateurPeriods.containing(periodicite, dateValeur)
    )
  );
};
