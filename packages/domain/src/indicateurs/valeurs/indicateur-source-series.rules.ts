import type { IndicateurPeriodicite } from '../indicateur/indicateur-periodicite.schema';
import { IndicateurPeriodes } from './indicateur-periodes';

type SerieValeur = {
  periodicite: IndicateurPeriodicite;
  dateValeur: string;
  metadonneeId?: number | null;
};

/**
 * Périodicités pour lesquelles deux versions d'une même source (métadonnées
 * différentes) portent une valeur sur la même période : on ne peut alors pas
 * les fusionner en une seule série.
 *
 * On compare la période et non la date brute : une valeur annuelle historique
 * n'est pas forcément datée du 1er janvier, mais s'affiche sur son année.
 */
export const getPeriodicitesAvecVersionsEnConflit = (
  valeurs: readonly SerieValeur[]
): Set<IndicateurPeriodicite> => {
  const versionParPeriode = new Map<string, number | null>();
  const enConflit = new Set<IndicateurPeriodicite>();
  for (const { periodicite, dateValeur, metadonneeId = null } of valeurs) {
    const key = IndicateurPeriodes.key(
      IndicateurPeriodes.containing(periodicite, dateValeur)
    );
    if (
      versionParPeriode.has(key) &&
      versionParPeriode.get(key) !== metadonneeId
    ) {
      enConflit.add(periodicite);
    }
    versionParPeriode.set(key, metadonneeId);
  }
  return enConflit;
};

/**
 * Versions d'une source, la plus récente d'abord : une série qui fusionne
 * plusieurs versions affiche les métadonnées de la dernière.
 */
export const sortVersionsRecentesDabord = <M extends { dateVersion: string }>(
  metadonnees: readonly M[]
): M[] =>
  metadonnees.toSorted((a, b) => b.dateVersion.localeCompare(a.dateVersion));

/**
 * Clé de série d'une valeur : une série par périodicité, et par version de la
 * source seulement si ces versions se chevauchent (sinon les imports
 * successifs d'une même source restent sur une seule ligne).
 */
export const getSerieKey = (
  { periodicite, metadonneeId }: SerieValeur,
  periodicitesEnConflit: ReadonlySet<string>
): string =>
  periodicitesEnConflit.has(periodicite)
    ? `${periodicite}-${metadonneeId ?? 'local'}`
    : periodicite;
