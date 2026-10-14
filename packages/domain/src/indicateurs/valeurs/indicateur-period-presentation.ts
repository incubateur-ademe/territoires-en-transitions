import {
  IndicateurPeriodiciteEnum,
  type IndicateurPeriodicite,
} from '../definitions/indicateur-periodicite.schema';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export type IndicateurPeriodChartTimeAxis = Readonly<{
  useUTC: true;
  minInterval: number;
  maxInterval: number;
}>;

export type IndicateurPeriodPresentation = Readonly<{
  chartTimeAxis: IndicateurPeriodChartTimeAxis;
}>;

/**
 * Chart intervals shared by browser and server renderers. Period labels come
 * from IndicateurPeriodes.format; React controls and application wording stay
 * in the frontend adapter layered on top of this registry.
 */
type IndicateurPeriodPresentationRegistry = Readonly<
  Record<IndicateurPeriodicite, IndicateurPeriodPresentation>
>;

const presentationByPeriodicite: IndicateurPeriodPresentationRegistry =
  Object.freeze({
    [IndicateurPeriodiciteEnum.ANNUELLE]: {
      chartTimeAxis: {
        useUTC: true,
        minInterval: 365 * DAY_IN_MILLISECONDS,
        maxInterval: 5 * 365 * DAY_IN_MILLISECONDS,
      },
    },
    [IndicateurPeriodiciteEnum.SEMESTRIELLE]: {
      chartTimeAxis: {
        useUTC: true,
        minInterval: 181 * DAY_IN_MILLISECONDS,
        maxInterval: 365 * DAY_IN_MILLISECONDS,
      },
    },
    [IndicateurPeriodiciteEnum.TRIMESTRIELLE]: {
      chartTimeAxis: {
        useUTC: true,
        minInterval: 90 * DAY_IN_MILLISECONDS,
        maxInterval: 365 * DAY_IN_MILLISECONDS,
      },
    },
    [IndicateurPeriodiciteEnum.MENSUELLE]: {
      chartTimeAxis: {
        useUTC: true,
        minInterval: 28 * DAY_IN_MILLISECONDS,
        maxInterval: 365 * DAY_IN_MILLISECONDS,
      },
    },
  });

export const getIndicateurPeriodPresentation = (
  periodicite: IndicateurPeriodicite
): IndicateurPeriodPresentation => presentationByPeriodicite[periodicite];
