import { IndicateurPeriodiciteEnum } from '../definitions/indicateur-periodicite.schema';
import { getYearFromIsoDate } from './iso-date.utils';

/** Only annual periods currently have supported input and storage rules. */
export type IndicateurPeriode = Readonly<{
  periodicite: typeof IndicateurPeriodiciteEnum.ANNUELLE;
  dateDebut: string;
}>;

export class IndicateurPeriodes {
  static parse(
    periodicite: IndicateurPeriode['periodicite'],
    value: string
  ): IndicateurPeriode | null {
    if (
      periodicite !== IndicateurPeriodiciteEnum.ANNUELLE ||
      !/^\d{4}$/.test(value) ||
      Number(value) === 0
    ) {
      return null;
    }
    return { periodicite, dateDebut: `${value}-01-01` };
  }

  static key(periode: IndicateurPeriode): string {
    // An annual period and a future January period must remain distinct.
    return `${periode.periodicite}:${periode.dateDebut}`;
  }

  /** Creates the annual period starting on January 1 of the given year. */
  static fromYear(year: number): IndicateurPeriode {
    const periode = IndicateurPeriodes.parse(
      IndicateurPeriodiciteEnum.ANNUELLE,
      String(year).padStart(4, '0')
    );
    if (!periode) throw new RangeError('Invalid annual indicator period');
    return periode;
  }

  static format(periode: IndicateurPeriode): string {
    switch (periode.periodicite) {
      case IndicateurPeriodiciteEnum.ANNUELLE:
        return String(getYearFromIsoDate(periode.dateDebut));
    }
  }

  /** Unions periods by full identity and orders them chronologically. */
  static merge(
    ...collections: ReadonlyArray<readonly IndicateurPeriode[]>
  ): IndicateurPeriode[] {
    const periodes = new Map<string, IndicateurPeriode>();
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
