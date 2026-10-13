import {
  IndicateurPeriodiciteEnum,
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
  LocalDate,
} from './indicateur-periode.types';
import { parseLocalDate, toLocalDate } from './local-calendar';

export type {
  IndicateurPeriode,
  IndicateurPeriodeKey,
  LocalDate,
} from './indicateur-periode.types';
export {
  indicateurPeriodeBrand,
  indicateurPeriodeKeyBrand,
  localDateBrand,
} from './indicateur-periode.types';

/** Only annual periods currently have supported input and storage rules. */
export type IndicateurPeriodeAnnuelle = IndicateurPeriode<
  typeof IndicateurPeriodiciteEnum.ANNUELLE
>;

/** Canonical period contract shared by storage, calculations and input forms. */
export class IndicateurPeriodes {
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
    IndicateurPeriodes.assertAnnual(periodicite);
    const { year } = parseLocalDate(date);
    return Object.freeze({
      periodicite,
      dateDebut: toLocalDate({ year, month: 1, day: 1 }),
    }) as IndicateurPeriode<K>;
  }

  /** Parses serialized periods, throwing a typed domain error on invalid input. */
  static parse<K extends IndicateurPeriodicite>(
    periodicite: K,
    value: string
  ): IndicateurPeriode<K> {
    IndicateurPeriodes.assertAnnual(periodicite);
    if (!/^\d{4}$/.test(value) || value === '0000') {
      throw createIndicateurPeriodeError({
        code: IndicateurPeriodeErrorEnum.INDICATEUR_PERIODE_INVALID,
        details: { periodicite, value },
      });
    }
    return IndicateurPeriodes.containing(periodicite, `${value}-01-01`);
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
    const periode = IndicateurPeriodes.containing(periodicite, dateValeur);
    if (periode.dateDebut !== dateValeur) {
      throw createIndicateurPeriodeError({
        code: IndicateurPeriodeErrorEnum.INDICATEUR_PERIODE_DATE_NON_CANONICAL,
        details: { periodicite, dateValeur },
      });
    }
    return periode;
  }

  static toDateValeur(periode: IndicateurPeriode): LocalDate {
    return IndicateurPeriodes.fromDateValeur(
      periode.periodicite,
      periode.dateDebut
    ).dateDebut;
  }

  static serialize(periode: IndicateurPeriode): string {
    return IndicateurPeriodes.toDateValeur(periode).slice(0, 4);
  }

  static key(periode: IndicateurPeriode): IndicateurPeriodeKey {
    return `${periode.periodicite}:${IndicateurPeriodes.serialize(
      periode
    )}` as IndicateurPeriodeKey;
  }

  /** Keeps partial drafts intact; null rejects an edit without replacing the draft. */
  static normalizeDraft(
    periodicite: IndicateurPeriodeAnnuelle['periodicite'],
    value: string
  ): string | null {
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
    return [...periodes.values()].sort(
      (a, b) =>
        a.dateDebut.localeCompare(b.dateDebut) ||
        a.periodicite.localeCompare(b.periodicite)
    );
  }
}
