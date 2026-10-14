import {
  getIndicateurPeriodPresentation,
  IndicateurPeriodicite,
  IndicateurPeriodes,
} from '@tet/domain/indicateurs';
import { DateTime } from 'luxon';

type IndicateurChartPeriodAdapter = Readonly<{
  useUTC: true;
  minInterval: number;
  maxInterval: number;
  formatTick: (value: number | string) => string;
}>;

const toUtcLocalDate = (value: number | string): string => {
  const dateTime =
    typeof value === 'number'
      ? DateTime.fromMillis(value, { zone: 'utc' })
      : DateTime.fromISO(value, { zone: 'utc' });
  const date = dateTime.toISODate();
  if (!date) {
    throw new Error(`Valeur d'axe temporel invalide : ${String(value)}`);
  }
  return date;
};

export const getIndicateurChartPeriodAdapter = (
  periodicite: IndicateurPeriodicite
): IndicateurChartPeriodAdapter => {
  const presentation = getIndicateurPeriodPresentation(periodicite);
  return {
    ...presentation.chartTimeAxis,
    formatTick: (value) =>
      IndicateurPeriodes.format(
        IndicateurPeriodes.containing(periodicite, toUtcLocalDate(value))
      ),
  };
};
