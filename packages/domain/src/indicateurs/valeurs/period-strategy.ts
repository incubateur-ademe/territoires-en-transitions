import type { IndicateurPeriodicite } from '../definitions/indicateur-periodicite.schema';
import type { IndicateurPeriod, LocalDate } from './indicateur-period.types';

type PeriodCodec<K extends IndicateurPeriodicite> = Readonly<{
  parse: (value: string) => IndicateurPeriod<K>;
  serialize: (period: IndicateurPeriod<K>) => string;
  fromDateValeur: (dateValeur: string) => IndicateurPeriod<K>;
  toDateValeur: (period: IndicateurPeriod<K>) => LocalDate;
}>;

type PeriodArithmetic<K extends IndicateurPeriodicite> = Readonly<{
  containing: (date: string) => IndicateurPeriod<K>;
  add: (period: IndicateurPeriod<K>, amount: number) => IndicateurPeriod<K>;
  compare: (left: IndicateurPeriod<K>, right: IndicateurPeriod<K>) => number;
  endExclusive: (period: IndicateurPeriod<K>) => LocalDate;
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
): IndicateurPeriod<K> =>
  Object.freeze({ periodicite, dateDebut }) as IndicateurPeriod<K>;
