import {
  IndicateurPeriode,
  IndicateurPeriodicite,
  IndicateurPeriodiciteEnum,
  IndicateurPeriodes,
  LocalDate,
} from '@tet/domain/indicateurs';

type StoredIndicateurPeriode = Readonly<{
  periodicite: IndicateurPeriodicite;
  dateValeur: string;
}>;

/** PostgreSQL boundary: persisted dates must already be canonical. */
export const hydrateIndicateurPeriode = ({
  periodicite,
  dateValeur,
}: StoredIndicateurPeriode): IndicateurPeriode =>
  IndicateurPeriodes.fromDateValeur(periodicite, dateValeur);

/** Preserve historical annual clients; new cadences use canonical dates. */
export const hydrateLegacyIndicateurPeriode = ({
  periodicite,
  dateValeur,
}: Readonly<{
  periodicite?: IndicateurPeriodicite;
  dateValeur: string;
}>): IndicateurPeriode =>
  periodicite === undefined ||
  periodicite === IndicateurPeriodiciteEnum.ANNUELLE
    ? IndicateurPeriodes.containing(
        IndicateurPeriodiciteEnum.ANNUELLE,
        dateValeur
      )
    : hydrateIndicateurPeriode({ periodicite, dateValeur });

export const dehydrateIndicateurPeriode = (
  periode: IndicateurPeriode
): LocalDate => IndicateurPeriodes.toDateValeur(periode);

/** Legacy date-only write contracts have always represented annual data. */
export const getLegacyIndicateurPeriodicite = (
  periodicite: IndicateurPeriodicite | undefined
): IndicateurPeriodicite => periodicite ?? IndicateurPeriodiciteEnum.ANNUELLE;
