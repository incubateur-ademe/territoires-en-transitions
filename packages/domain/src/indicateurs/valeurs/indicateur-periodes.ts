import {
  IndicateurPeriodiciteEnum,
  indicateurPeriodiciteValues,
  type IndicateurPeriodicite,
} from '../definitions/indicateur-periodicite.schema';
import {
  createIndicateurPeriodeError,
  IndicateurPeriodeErrorEnum,
  isIndicateurPeriodeError,
} from './indicateur-periode.errors';
import type {
  IndicateurPeriode,
  IndicateurPeriodeKey,
  IndicateurPeriodeParseResult,
  LocalCalendarDate,
  LocalDate,
} from './indicateur-periode.types';
import { toLocalDate } from './local-calendar';
import { createCalendarMonthStrategy } from './calendar-month-period.strategy';
import type { PeriodStrategy, PeriodStrategyRegistry } from './period-strategy';

export type {
  IndicateurPeriode,
  IndicateurPeriodeJson,
  IndicateurPeriodeKey,
  IndicateurPeriodeParseResult,
  LocalCalendarDate,
  LocalDate,
} from './indicateur-periode.types';
export {
  indicateurPeriodeBrand,
  indicateurPeriodeKeyBrand,
  localDateBrand,
} from './indicateur-periode.types';

const periodStrategies = Object.freeze({
  [IndicateurPeriodiciteEnum.ANNUELLE]: createCalendarMonthStrategy({
    periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
    monthsPerPeriod: 12,
    anchorDate: '2000-01-01',
    serialization: 'year',
  }),
}) satisfies Partial<PeriodStrategyRegistry>;

const strategyFor = <K extends IndicateurPeriodicite>(
  periodicite: K
): PeriodStrategy<K> => {
  const strategy = (periodStrategies as Partial<PeriodStrategyRegistry>)[
    periodicite
  ];
  if (!strategy) {
    throw createIndicateurPeriodeError({
      code: IndicateurPeriodeErrorEnum.INDICATEUR_PERIODICITE_UNSUPPORTED,
      details: { periodicite },
    });
  }
  return strategy as PeriodStrategy<K>;
};

/** Periodicities currently implemented by the period helpers and input forms. */
export type SupportedIndicateurPeriodicite =
  (typeof IndicateurPeriodes.supportedPeriodicites)[number];

/** For capabilities whose business contract specifically requires a year. */
export type IndicateurPeriodeAnnuelle = IndicateurPeriode<
  typeof IndicateurPeriodiciteEnum.ANNUELLE
>;

/** Canonical period contract shared by storage, calculations and input forms. */
export class IndicateurPeriodes {
  static readonly supportedPeriodicites = Object.freeze([
    IndicateurPeriodiciteEnum.ANNUELLE,
  ] as const);

  static isSupported(
    periodicite: IndicateurPeriodicite | null | undefined
  ): periodicite is SupportedIndicateurPeriodicite {
    return IndicateurPeriodes.supportedPeriodicites.some(
      (supported) => supported === periodicite
    );
  }

  private static assertSupported(
    periodicite: IndicateurPeriodicite
  ): asserts periodicite is SupportedIndicateurPeriodicite {
    if (!IndicateurPeriodes.isSupported(periodicite)) {
      throw createIndicateurPeriodeError({
        code: IndicateurPeriodeErrorEnum.INDICATEUR_PERIODICITE_UNSUPPORTED,
        details: { periodicite },
      });
    }
  }

  /** Guards capabilities whose business contract requires annual observations. */
  static assertAnnual(
    periodicite: IndicateurPeriodicite | null | undefined,
    capability = 'Le contrat de période annuel'
  ): asserts periodicite is typeof IndicateurPeriodiciteEnum.ANNUELLE {
    if (periodicite !== IndicateurPeriodiciteEnum.ANNUELLE) {
      throw createIndicateurPeriodeError({
        code: IndicateurPeriodeErrorEnum.INDICATEUR_ANNUAL_PERIODICITE_REQUIRED,
        details: { periodicite, capability },
      });
    }
  }

  static containing<K extends IndicateurPeriodicite>(
    periodicite: K,
    date: string
  ): IndicateurPeriode<K> {
    return strategyFor(periodicite).containing(date);
  }

  /** Parses serialized periods, throwing a typed domain error on invalid input. */
  static parse<K extends IndicateurPeriodicite>(
    periodicite: K,
    value: string
  ): IndicateurPeriode<K> {
    return strategyFor(periodicite).parse(value);
  }

  /** Incomplete or invalid form drafts are not yet periods. */
  static tryParse<K extends IndicateurPeriodicite>(
    periodicite: K,
    value: string
  ): IndicateurPeriode<K> | null {
    try {
      return IndicateurPeriodes.parse(periodicite, value);
    } catch (error) {
      if (
        isIndicateurPeriodeError(error) &&
        error.code === IndicateurPeriodeErrorEnum.INDICATEUR_PERIODE_INVALID
      ) {
        return null;
      }
      throw error;
    }
  }

  static fromDateValeur<K extends IndicateurPeriodicite>(
    periodicite: K,
    dateValeur: string
  ): IndicateurPeriode<K> {
    return strategyFor(periodicite).fromDateValeur(dateValeur);
  }

  static toDateValeur(periode: IndicateurPeriode): LocalDate {
    return strategyFor(periode.periodicite).toDateValeur(periode);
  }

  static serialize(periode: IndicateurPeriode): string {
    return strategyFor(periode.periodicite).serialize(periode);
  }

  static key(periode: IndicateurPeriode): IndicateurPeriodeKey {
    return `${periode.periodicite}:${IndicateurPeriodes.serialize(
      periode
    )}` as IndicateurPeriodeKey;
  }

  /** Keeps partial drafts intact; null rejects an edit without replacing the draft. */
  static normalizeDraft(
    periodicite: SupportedIndicateurPeriodicite,
    value: string
  ): string | null {
    IndicateurPeriodes.assertSupported(periodicite);
    switch (periodicite) {
      case IndicateurPeriodiciteEnum.ANNUELLE: {
        const digits = value.replace(/\D/g, '');
        return digits.length <= 4 ? digits : null;
      }
    }
  }

  /** Creates the annual period starting on January 1 of the given year. */
  static fromYear(year: number): IndicateurPeriodeAnnuelle {
    const periode = IndicateurPeriodes.tryParse(
      IndicateurPeriodiciteEnum.ANNUELLE,
      String(year).padStart(4, '0')
    );
    if (!periode) throw new RangeError('Invalid annual indicator period');
    return periode;
  }

  /** Extracts an annual observation's year, requiring a canonical storage date. */
  static toAnnualYear(
    periodicite: IndicateurPeriodicite | null | undefined,
    dateValeur: string,
    capability: string
  ): number {
    IndicateurPeriodes.assertAnnual(periodicite, capability);
    return Number(
      IndicateurPeriodes.serialize(
        IndicateurPeriodes.fromDateValeur(periodicite, dateValeur)
      )
    );
  }

  /**
   * Reads immutable historical payloads from before annual dates were canonical.
   * Current records must use `toAnnualYear`; other periodicities remain rejected.
   */
  static toAnnualYearFromHistoricalDate(
    periodicite: IndicateurPeriodicite | null | undefined,
    dateValeur: string,
    capability: string
  ): number {
    IndicateurPeriodes.assertAnnual(periodicite, capability);
    return Number(
      IndicateurPeriodes.serialize(
        IndicateurPeriodes.containing(periodicite, dateValeur)
      )
    );
  }

  static format(periode: IndicateurPeriode): string {
    return String(Number(IndicateurPeriodes.serialize(periode)));
  }

  /** Compares periods at the requested periodicity, using the local calendar. */
  static isFuture(
    periode: IndicateurPeriode,
    referenceDate: Date = new Date()
  ): boolean {
    const currentPeriode = IndicateurPeriodes.containing(
      periode.periodicite,
      toLocalDate({
        year: referenceDate.getFullYear(),
        month: referenceDate.getMonth() + 1,
        day: referenceDate.getDate(),
      })
    );
    return IndicateurPeriodes.toDateValeur(periode) > currentPeriode.dateDebut;
  }

  /** Unions periods by full identity and orders them chronologically. */
  static merge<K extends IndicateurPeriodicite>(
    ...collections: ReadonlyArray<readonly IndicateurPeriode<K>[]>
  ): IndicateurPeriode<K>[] {
    const periodes = new Map<IndicateurPeriodeKey, IndicateurPeriode<K>>();
    for (const collection of collections) {
      for (const periode of collection) {
        periodes.set(IndicateurPeriodes.key(periode), periode);
      }
    }
    return [...periodes.values()].sort(IndicateurPeriodes.compareTotal);
  }

  static fromKey(value: string): IndicateurPeriode {
    const separatorIndex = value.indexOf(':');
    if (separatorIndex < 1) {
      throw createIndicateurPeriodeError({
        code: IndicateurPeriodeErrorEnum.INDICATEUR_PERIODE_KEY_INVALID,
        details: { value },
      });
    }
    const periodicite = value.slice(0, separatorIndex);
    if (
      !indicateurPeriodiciteValues.some(
        (supported) => supported === periodicite
      )
    ) {
      throw createIndicateurPeriodeError({
        code: IndicateurPeriodeErrorEnum.INDICATEUR_PERIODICITE_UNKNOWN,
        details: { periodicite },
      });
    }
    return IndicateurPeriodes.parse(
      periodicite as IndicateurPeriodicite,
      value.slice(separatorIndex + 1)
    );
  }

  static safeFromKey(value: string): IndicateurPeriodeParseResult {
    try {
      return { success: true, period: IndicateurPeriodes.fromKey(value) };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  static add<K extends IndicateurPeriodicite>(
    periode: IndicateurPeriode<K>,
    amount: number
  ): IndicateurPeriode<K> {
    return strategyFor(periode.periodicite).add(periode, amount);
  }

  static next<K extends IndicateurPeriodicite>(
    periode: IndicateurPeriode<K>
  ): IndicateurPeriode<K> {
    return IndicateurPeriodes.add(periode, 1);
  }

  static compare<K extends IndicateurPeriodicite>(
    left: IndicateurPeriode<K>,
    right: IndicateurPeriode<K>
  ): number {
    if (left.periodicite !== right.periodicite) {
      throw createIndicateurPeriodeError({
        code: IndicateurPeriodeErrorEnum.INDICATEUR_PERIODICITE_MISMATCH,
        details: { expected: left.periodicite, actual: right.periodicite },
      });
    }
    return strategyFor(left.periodicite).compare(left, right);
  }

  static compareTotal(
    left: IndicateurPeriode,
    right: IndicateurPeriode
  ): number {
    return (
      IndicateurPeriodes.toDateValeur(left).localeCompare(
        IndicateurPeriodes.toDateValeur(right)
      ) ||
      indicateurPeriodiciteValues.indexOf(left.periodicite) -
        indicateurPeriodiciteValues.indexOf(right.periodicite)
    );
  }

  static current<K extends IndicateurPeriodicite>(
    periodicite: K,
    calendarDate: LocalCalendarDate
  ): IndicateurPeriode<K> {
    return IndicateurPeriodes.containing(
      periodicite,
      toLocalDate(calendarDate)
    );
  }

  static isStarted(
    periode: IndicateurPeriode,
    calendarDate: LocalCalendarDate
  ): boolean {
    return (
      IndicateurPeriodes.toDateValeur(periode) <= toLocalDate(calendarDate)
    );
  }

  static endExclusive(periode: IndicateurPeriode): LocalDate {
    return strategyFor(periode.periodicite).endExclusive(periode);
  }
}
