import {
  IndicateurPeriod,
  IndicateurPeriodicite,
  IndicateurPeriods,
  LocalDate,
} from '@tet/domain/indicateurs';

type StoredIndicateurPeriod = Readonly<{
  periodicite: IndicateurPeriodicite;
  dateValeur: string;
}>;

/** PostgreSQL/legacy-date boundary for the indicator period value object. */
export const hydrateIndicateurPeriod = ({
  periodicite,
  dateValeur,
}: StoredIndicateurPeriod): IndicateurPeriod =>
  IndicateurPeriods.fromDateValeur(periodicite, dateValeur);

export const dehydrateIndicateurPeriod = (
  period: IndicateurPeriod
): LocalDate => IndicateurPeriods.toDateValeur(period);
