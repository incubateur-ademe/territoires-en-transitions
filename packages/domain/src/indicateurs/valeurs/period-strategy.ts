import type { IndicateurPeriodicite } from '../definitions/indicateur-periodicite.schema';
import type { IndicateurPeriode, LocalDate } from './indicateur-periode.types';

type PeriodCodec<K extends IndicateurPeriodicite> = Readonly<{
  parse: (value: string) => IndicateurPeriode<K>;
  serialize: (period: IndicateurPeriode<K>) => string;
  fromDateValeur: (dateValeur: string) => IndicateurPeriode<K>;
  toDateValeur: (period: IndicateurPeriode<K>) => LocalDate;
}>;

type PeriodArithmetic<K extends IndicateurPeriodicite> = Readonly<{
  containing: (date: string) => IndicateurPeriode<K>;
  add: (period: IndicateurPeriode<K>, amount: number) => IndicateurPeriode<K>;
  compare: (left: IndicateurPeriode<K>, right: IndicateurPeriode<K>) => number;
  endExclusive: (period: IndicateurPeriode<K>) => LocalDate;
}>;

export type PeriodStrategy<K extends IndicateurPeriodicite> = Readonly<{
  periodicite: K;
}> &
  PeriodCodec<K> &
  PeriodArithmetic<K>;

export type PeriodStrategyRegistry = {
  readonly [K in IndicateurPeriodicite]: PeriodStrategy<K>;
};

/** The only low-level constructor; strategy factories are its sole callers. */
export const createPeriod = <K extends IndicateurPeriodicite>(
  periodicite: K,
  dateDebut: LocalDate
): IndicateurPeriode<K> =>
  Object.freeze({ periodicite, dateDebut }) as IndicateurPeriode<K>;
