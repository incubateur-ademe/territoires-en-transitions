import type { IndicateurPeriodicite } from '../definitions/indicateur-periodicite.schema';
import {
  createIndicateurPeriodError,
  IndicateurPeriodErrorEnum,
} from './indicateur-period.errors';
import type {
  IndicateurPeriod,
  IndicateurPeriodKey,
  LocalDate,
} from './indicateur-period.types';
import { parseLocalDate, toLocalDate } from './local-calendar';

export type {
  IndicateurPeriod,
  IndicateurPeriodKey,
  LocalDate,
} from './indicateur-period.types';
export {
  indicateurPeriodBrand,
  indicateurPeriodKeyBrand,
  localDateBrand,
} from './indicateur-period.types';

const PERIOD_KEY_SEPARATOR = ':';

const assertAnnual = (periodicite: IndicateurPeriodicite): void => {
  if (periodicite !== 'annuelle') {
    throw createIndicateurPeriodError({
      code: IndicateurPeriodErrorEnum.INDICATEUR_ANNUAL_PERIODICITE_REQUIRED,
      details: { periodicite, capability: 'Le contrat de période annuel' },
    });
  }
};

const containing = <K extends IndicateurPeriodicite>(
  periodicite: K,
  date: string
): IndicateurPeriod<K> => {
  assertAnnual(periodicite);
  const { year } = parseLocalDate(date);
  return Object.freeze({
    periodicite,
    dateDebut: toLocalDate({ year, month: 1, day: 1 }),
  }) as IndicateurPeriod<K>;
};

const parse = <K extends IndicateurPeriodicite>(
  periodicite: K,
  value: string
): IndicateurPeriod<K> => {
  assertAnnual(periodicite);
  if (!/^\d{4}$/.test(value) || value === '0000') {
    throw createIndicateurPeriodError({
      code: IndicateurPeriodErrorEnum.INDICATEUR_PERIOD_INVALID,
      details: { periodicite, value },
    });
  }
  return containing(periodicite, `${value}-01-01`);
};

const fromDateValeur = <K extends IndicateurPeriodicite>(
  periodicite: K,
  dateValeur: string
): IndicateurPeriod<K> => {
  const period = containing(periodicite, dateValeur);
  if (period.dateDebut !== dateValeur) {
    throw createIndicateurPeriodError({
      code: IndicateurPeriodErrorEnum.INDICATEUR_PERIOD_DATE_NON_CANONICAL,
      details: { periodicite, dateValeur },
    });
  }
  return period;
};

const toDateValeur = (period: IndicateurPeriod): LocalDate =>
  fromDateValeur(period.periodicite, period.dateDebut).dateDebut;

const serialize = <K extends IndicateurPeriodicite>(
  period: IndicateurPeriod<K>
): string => toDateValeur(period).slice(0, 4);

const key = (period: IndicateurPeriod): IndicateurPeriodKey =>
  `${period.periodicite}${PERIOD_KEY_SEPARATOR}${serialize(
    period
  )}` as IndicateurPeriodKey;

/** Annual period identity used by the value and calculation pipelines. */
export const IndicateurPeriods = Object.freeze({
  parse,
  fromDateValeur,
  containing,
  toDateValeur,
  serialize,
  key,
});
