import * as z from 'zod/mini';
import {
  indicateurPeriodiciteSchema,
  indicateurPeriodiciteValues,
  type IndicateurPeriodicite,
} from '../definitions/indicateur-periodicite.schema';
import { createCalendarMonthStrategy } from './calendar-month-period.strategy';
import type {
  IndicateurPeriod,
  IndicateurPeriodJson,
  IndicateurPeriodKey,
  IndicateurPeriodParseResult,
  LocalCalendarDate,
  LocalDate,
} from './indicateur-period.types';
import { toLocalDate } from './local-calendar';
import type { PeriodStrategy, PeriodStrategyRegistry } from './period-strategy';

export type {
  IndicateurPeriod,
  IndicateurPeriodJson,
  IndicateurPeriodKey,
  IndicateurPeriodParseResult,
  LocalCalendarDate,
  LocalDate,
} from './indicateur-period.types';
export {
  indicateurPeriodBrand,
  indicateurPeriodKeyBrand,
  localDateBrand,
} from './indicateur-period.types';

const PERIOD_KEY_SEPARATOR = ':';

/**
 * Adding a periodicity to `IndicateurPeriodicite` makes this registry fail to
 * compile until a strategy is explicitly provided.
 */
const periodStrategies = Object.freeze({
  annuelle: createCalendarMonthStrategy({
    periodicite: 'annuelle',
    monthsPerPeriod: 12,
    anchorDate: '2000-01-01',
    serialization: 'year',
  }),
  mensuelle: createCalendarMonthStrategy({
    periodicite: 'mensuelle',
    monthsPerPeriod: 1,
    anchorDate: '2000-01-01',
    serialization: 'year-month',
  }),
}) satisfies PeriodStrategyRegistry;

/** Centralized cast preserving the correlation between a registry key and its strategy. */
const strategyFor = <K extends IndicateurPeriodicite>(
  periodicite: K
): PeriodStrategy<K> =>
  periodStrategies[periodicite] as unknown as PeriodStrategy<K>;

const assertPeriodPeriodicite: <K extends IndicateurPeriodicite>(
  period: IndicateurPeriod,
  periodicite: K
) => asserts period is IndicateurPeriod<K> = (period, periodicite) => {
  if (period.periodicite !== periodicite) {
    throw new Error(
      `Périodicités incompatibles : ${period.periodicite} et ${periodicite}`
    );
  }
};

const isIndicateurPeriodicite = (
  value: string
): value is IndicateurPeriodicite =>
  (indicateurPeriodiciteValues as readonly string[]).includes(value);

const parse = <K extends IndicateurPeriodicite>(
  periodicite: K,
  value: string
): IndicateurPeriod<K> => strategyFor(periodicite).parse(value);

const fromDateValeur = <K extends IndicateurPeriodicite>(
  periodicite: K,
  dateValeur: string
): IndicateurPeriod<K> => strategyFor(periodicite).fromDateValeur(dateValeur);

const containing = <K extends IndicateurPeriodicite>(
  periodicite: K,
  date: string
): IndicateurPeriod<K> => strategyFor(periodicite).containing(date);

const toDateValeur = (period: IndicateurPeriod): LocalDate =>
  strategyFor(period.periodicite).toDateValeur(period);

const serialize = <K extends IndicateurPeriodicite>(
  period: IndicateurPeriod<K>
): string => strategyFor(period.periodicite).serialize(period);

const key = (period: IndicateurPeriod): IndicateurPeriodKey =>
  `${period.periodicite}${PERIOD_KEY_SEPARATOR}${serialize(
    period
  )}` as IndicateurPeriodKey;

const fromKey = (value: string): IndicateurPeriod => {
  const separatorIndex = value.indexOf(PERIOD_KEY_SEPARATOR);
  if (separatorIndex < 1) {
    throw new Error(`Clé de période "${value}" invalide`);
  }
  const periodicite = value.slice(0, separatorIndex);
  const serialized = value.slice(separatorIndex + PERIOD_KEY_SEPARATOR.length);
  if (!isIndicateurPeriodicite(periodicite)) {
    throw new Error(`Périodicité "${periodicite}" inconnue`);
  }
  return parse(periodicite, serialized);
};

const safeFromKey = (value: string): IndicateurPeriodParseResult => {
  try {
    return { success: true, period: fromKey(value) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
};

const add = <K extends IndicateurPeriodicite>(
  period: IndicateurPeriod<K>,
  amount: number
): IndicateurPeriod<K> => strategyFor(period.periodicite).add(period, amount);

const next = <K extends IndicateurPeriodicite>(
  period: IndicateurPeriod<K>
): IndicateurPeriod<K> => add(period, 1);

const compare = <K extends IndicateurPeriodicite>(
  left: IndicateurPeriod<K>,
  right: IndicateurPeriod<K>
): number => {
  assertPeriodPeriodicite(right, left.periodicite);
  return strategyFor(left.periodicite).compare(left, right);
};

const compareTotal = (
  left: IndicateurPeriod,
  right: IndicateurPeriod
): number => {
  const dateComparison = toDateValeur(left).localeCompare(toDateValeur(right));
  if (dateComparison !== 0) {
    return dateComparison;
  }
  return (
    indicateurPeriodiciteValues.indexOf(left.periodicite) -
    indicateurPeriodiciteValues.indexOf(right.periodicite)
  );
};

const current = <K extends IndicateurPeriodicite>(
  periodicite: K,
  calendarDate: LocalCalendarDate
): IndicateurPeriod<K> => containing(periodicite, toLocalDate(calendarDate));

const isStarted = (
  period: IndicateurPeriod,
  calendarDate: LocalCalendarDate
): boolean => toDateValeur(period) <= toLocalDate(calendarDate);

const endExclusive = (period: IndicateurPeriod): LocalDate =>
  strategyFor(period.periodicite).endExclusive(period);

/**
 * Functional façade over the exhaustive periodicity strategy registry.
 * Consumers never dispatch on `periodicite` themselves once a period exists.
 */
export const IndicateurPeriods = Object.freeze({
  parse,
  fromDateValeur,
  containing,
  toDateValeur,
  serialize,
  key,
  fromKey,
  safeFromKey,
  add,
  next,
  compare,
  compareTotal,
  current,
  isStarted,
  endExclusive,
});

const indicateurPeriodJsonSchema = z.object({
  periodicite: indicateurPeriodiciteSchema,
  dateDebut: z.string(),
});

/** Validates and rehydrates a period received through a JSON boundary. */
export const indicateurPeriodSchema: z.ZodMiniType<
  IndicateurPeriod,
  IndicateurPeriodJson
> = z.pipe(
  indicateurPeriodJsonSchema,
  z.transform((value, context): IndicateurPeriod => {
    try {
      return fromDateValeur(value.periodicite, value.dateDebut);
    } catch (error) {
      context.issues.push({
        code: 'custom',
        input: value,
        message: error instanceof Error ? error.message : String(error),
      });
      return z.NEVER;
    }
  })
);
