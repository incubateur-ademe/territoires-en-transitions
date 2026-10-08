import {
  IndicateurPeriods,
  type IndicateurPeriodicite,
  type IndicateurPeriod,
} from '@tet/domain/indicateurs';

export type IndicateurPeriodInput = { year: string; subdivision: string };

export const parseIndicateurPeriodInput = (
  periodicite: IndicateurPeriodicite,
  input: IndicateurPeriodInput
): IndicateurPeriod => {
  const suffix = {
    annuelle: '',
    semestrielle: `-S${input.subdivision}`,
    trimestrielle: `-T${input.subdivision}`,
    mensuelle: `-${input.subdivision.padStart(2, '0')}`,
  }[periodicite];
  return IndicateurPeriods.parse(periodicite, `${input.year}${suffix}`);
};
