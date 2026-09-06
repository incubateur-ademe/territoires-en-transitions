import type { IndicateurPeriodicite } from '../definitions/indicateur-periodicite.schema';
import type { IndicateurPeriod } from './indicateur-period.types';
import {
  monthFromIndex,
  monthIndex,
  monthsPerYear,
  parseLocalDate,
  toLocalDate,
} from './local-calendar';
import { createPeriod, type PeriodStrategy } from './period-strategy';

type CalendarMonthSerialization = 'year' | 'year-month';

type CalendarMonthStrategyConfiguration<K extends IndicateurPeriodicite> =
  Readonly<{
    periodicite: K;
    monthsPerPeriod: number;
    anchorDate: string;
    serialization: CalendarMonthSerialization;
  }>;

const serializationPatterns: Readonly<
  Record<CalendarMonthSerialization, RegExp>
> = {
  year: /^(\d{4})$/,
  'year-month': /^(\d{4})-(0[1-9]|1[0-2])$/,
};

/**
 * Creates a stateless strategy for a cadence aligned on calendar months.
 * Annual and monthly periods differ only through this configuration.
 */
export const createCalendarMonthStrategy = <K extends IndicateurPeriodicite>({
  periodicite,
  monthsPerPeriod,
  anchorDate,
  serialization,
}: CalendarMonthStrategyConfiguration<K>): PeriodStrategy<K> => {
  if (
    !Number.isInteger(monthsPerPeriod) ||
    monthsPerPeriod < 1 ||
    monthsPerYear % monthsPerPeriod !== 0
  ) {
    throw new Error(
      `Pas calendaire invalide pour la périodicité ${periodicite}`
    );
  }

  const anchor = parseLocalDate(anchorDate);
  if (anchor.day !== 1) {
    throw new Error(
      `Ancrage calendaire invalide pour la périodicité ${periodicite}`
    );
  }
  if (
    serialization === 'year' &&
    (monthsPerPeriod !== monthsPerYear || anchor.month !== 1)
  ) {
    throw new Error(
      `Sérialisation annuelle incompatible avec la périodicité ${periodicite}`
    );
  }
  const anchorIndex = monthIndex(anchor.year, anchor.month);

  const containing = (dateValue: string): IndicateurPeriod<K> => {
    const date = parseLocalDate(dateValue);
    const startIndex =
      anchorIndex +
      Math.floor(
        (monthIndex(date.year, date.month) - anchorIndex) / monthsPerPeriod
      ) *
        monthsPerPeriod;
    const start = monthFromIndex(startIndex);
    return createPeriod(
      periodicite,
      toLocalDate({ year: start.year, month: start.month, day: 1 })
    );
  };

  const fromDateValeur = (dateValeur: string): IndicateurPeriod<K> => {
    const date = parseLocalDate(dateValeur);
    const period = containing(dateValeur);
    if (date.day !== 1 || period.dateDebut !== dateValeur) {
      throw new Error(
        `Date de valeur "${dateValeur}" non canonique pour une périodicité ${periodicite}`
      );
    }
    return period;
  };

  const parse = (value: string): IndicateurPeriod<K> => {
    const match = serializationPatterns[serialization].exec(value);
    if (!match || match[1] === '0000') {
      throw new Error(
        `Période "${value}" invalide pour une périodicité ${periodicite}`
      );
    }
    const year = Number(match[1]);
    const month = match[2] === undefined ? 1 : Number(match[2]);
    const dateDebut = toLocalDate({ year, month, day: 1 });
    const period = fromDateValeur(dateDebut);
    if (period.dateDebut !== dateDebut) {
      throw new Error(
        `Période "${value}" non alignée pour une périodicité ${periodicite}`
      );
    }
    return period;
  };

  const serialize = (period: IndicateurPeriod<K>): string => {
    const validatedPeriod = fromDateValeur(period.dateDebut);
    const { year, month } = parseLocalDate(validatedPeriod.dateDebut);
    const serializers: Readonly<
      Record<CalendarMonthSerialization, () => string>
    > = {
      year: () => String(year).padStart(4, '0'),
      'year-month': () =>
        `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}`,
    };
    return serializers[serialization]();
  };

  const toDateValeur = (period: IndicateurPeriod<K>) =>
    fromDateValeur(period.dateDebut).dateDebut;

  const add = (
    period: IndicateurPeriod<K>,
    amount: number
  ): IndicateurPeriod<K> => {
    if (!Number.isInteger(amount)) {
      throw new Error("Le déplacement d'une période doit être un entier");
    }
    const validatedPeriod = fromDateValeur(period.dateDebut);
    const start = parseLocalDate(validatedPeriod.dateDebut);
    const target = monthFromIndex(
      monthIndex(start.year, start.month) + amount * monthsPerPeriod
    );
    return createPeriod(
      periodicite,
      toLocalDate({ year: target.year, month: target.month, day: 1 })
    );
  };

  const compare = (
    left: IndicateurPeriod<K>,
    right: IndicateurPeriod<K>
  ): number => {
    const leftDate = fromDateValeur(left.dateDebut).dateDebut;
    const rightDate = fromDateValeur(right.dateDebut).dateDebut;
    return leftDate.localeCompare(rightDate);
  };

  const endExclusive = (period: IndicateurPeriod<K>) =>
    add(period, 1).dateDebut;

  return Object.freeze({
    periodicite,
    parse,
    serialize,
    fromDateValeur,
    toDateValeur,
    containing,
    add,
    compare,
    endExclusive,
  });
};
