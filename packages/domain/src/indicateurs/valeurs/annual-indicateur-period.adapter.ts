import type { IndicateurPeriodicite } from '../definitions/indicateur-periodicite.schema';
import { IndicateurPeriods } from './indicateur-period';

/**
 * Explicit boundary for legacy capabilities whose business contract is an
 * annual series. They fail closed until an aggregation policy is designed;
 * they never collapse a finer cadence to a year implicitly.
 */
export function assertAnnualIndicateurPeriodicite(
  periodicite: IndicateurPeriodicite | null | undefined,
  capability: string
): asserts periodicite is 'annuelle' {
  if (periodicite !== 'annuelle') {
    throw new Error(
      `${capability} exige une périodicité annuelle, reçu : ${
        periodicite ?? 'absente'
      }`
    );
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
