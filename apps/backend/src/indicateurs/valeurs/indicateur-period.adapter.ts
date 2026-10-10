import {
  IndicateurPeriod,
  IndicateurPeriodicite,
  IndicateurPeriodiciteEnum,
  IndicateurPeriods,
  LocalDate,
} from '@tet/domain/indicateurs';

type StoredIndicateurPeriod = Readonly<{
  periodicite: IndicateurPeriodicite;
  dateValeur: string;
}>;

/** PostgreSQL boundary: persisted dates must already be canonical. */
export const hydrateIndicateurPeriod = ({
  periodicite,
  dateValeur,
}: StoredIndicateurPeriod): IndicateurPeriod =>
  IndicateurPeriods.fromDateValeur(periodicite, dateValeur);

/** Preserve historical annual clients; new cadences use canonical dates. */
export const hydrateLegacyIndicateurPeriod = ({
  periodicite,
  dateValeur,
}: Readonly<{
  periodicite?: IndicateurPeriodicite;
  dateValeur: string;
}>): IndicateurPeriod =>
  periodicite === undefined ||
  periodicite === IndicateurPeriodiciteEnum.ANNUELLE
    ? IndicateurPeriods.containing(
        IndicateurPeriodiciteEnum.ANNUELLE,
        dateValeur
      )
    : hydrateIndicateurPeriod({ periodicite, dateValeur });

export const dehydrateIndicateurPeriod = (
  period: IndicateurPeriod
): LocalDate => IndicateurPeriods.toDateValeur(period);

/** Legacy date-only write contracts have always represented annual data. */
export const getLegacyIndicateurPeriodicite = (
  periodicite: IndicateurPeriodicite | undefined
): IndicateurPeriodicite => periodicite ?? IndicateurPeriodiciteEnum.ANNUELLE;
