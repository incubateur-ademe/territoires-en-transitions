import {
  IndicateurPeriodes,
  type IndicateurPeriodicite,
} from '@tet/domain/indicateurs';

export const toSousIndicateurPeriodLabel = ({
  periodicite,
  dateValeur,
}: {
  periodicite: IndicateurPeriodicite;
  dateValeur: string;
}): string => {
  const [year, month, day] = dateValeur.slice(0, 10).split('-').map(Number);
  return IndicateurPeriodes.format(
    IndicateurPeriodes.current(periodicite, { year, month, day })
  );
};
