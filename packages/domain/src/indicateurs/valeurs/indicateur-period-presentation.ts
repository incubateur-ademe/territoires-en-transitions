import type { IndicateurPeriodicite } from '../definitions/indicateur-periodicite.schema';
import { IndicateurPeriods } from './indicateur-period';
import type { IndicateurPeriod } from './indicateur-period.types';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export type IndicateurPeriodChartTimeAxis = Readonly<{
  useUTC: true;
  minInterval: number;
  maxInterval: number;
}>;

export type IndicateurPeriodPresentation<
  K extends IndicateurPeriodicite = IndicateurPeriodicite
> = Readonly<{
  formatLabel: (period: IndicateurPeriod<K>, locale: string) => string;
  chartTimeAxis: IndicateurPeriodChartTimeAxis;
}>;

const formatMonthlyPeriod = (
  period: IndicateurPeriod<'mensuelle'>,
  locale: string
): string =>
  new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(
    new Date(`${IndicateurPeriods.toDateValeur(period)}T00:00:00.000Z`)
  );

/**
 * Environment-neutral presentation policy shared by browser and server
 * renderers. React controls and application wording deliberately stay in the
 * frontend adapter layered on top of this registry.
 */
type IndicateurPeriodPresentationRegistry = Readonly<{
  [K in IndicateurPeriodicite]: IndicateurPeriodPresentation<K>;
}>;

const presentationByPeriodicite: IndicateurPeriodPresentationRegistry =
  Object.freeze({
    annuelle: {
      formatLabel: (period) => IndicateurPeriods.serialize(period),
      chartTimeAxis: {
        useUTC: true,
        minInterval: 365 * DAY_IN_MILLISECONDS,
        maxInterval: 5 * 365 * DAY_IN_MILLISECONDS,
      },
    },
    mensuelle: {
      formatLabel: formatMonthlyPeriod,
      chartTimeAxis: {
        useUTC: true,
        minInterval: 28 * DAY_IN_MILLISECONDS,
        maxInterval: 365 * DAY_IN_MILLISECONDS,
      },
    },
  });

export const getIndicateurPeriodPresentation = <
  K extends IndicateurPeriodicite
>(
  periodicite: K
): IndicateurPeriodPresentationRegistry[K] =>
  presentationByPeriodicite[periodicite];

export const formatIndicateurPeriod = <K extends IndicateurPeriodicite>(
  period: IndicateurPeriod<K>,
  locale = 'fr-FR'
): string =>
  getIndicateurPeriodPresentation(period.periodicite).formatLabel(
    period,
    locale
  );
