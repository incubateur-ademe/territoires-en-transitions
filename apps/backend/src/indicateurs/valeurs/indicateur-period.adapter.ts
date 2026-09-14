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

/** Preserve date-only annual clients; explicit monthly dates remain strict. */
export const hydrateLegacyIndicateurPeriod = ({
  periodicite,
  dateValeur,
}: StoredIndicateurPeriod): IndicateurPeriod =>
  periodicite === IndicateurPeriodiciteEnum.ANNUELLE
    ? IndicateurPeriods.containing(periodicite, dateValeur)
    : hydrateIndicateurPeriod({ periodicite, dateValeur });

export const dehydrateIndicateurPeriod = (
  period: IndicateurPeriod
): LocalDate => IndicateurPeriods.toDateValeur(period);

/** Legacy date-only write contracts have always represented annual data. */
export const getLegacyIndicateurPeriodicite = (
  periodicite: IndicateurPeriodicite | undefined
): IndicateurPeriodicite => periodicite ?? IndicateurPeriodiciteEnum.ANNUELLE;
