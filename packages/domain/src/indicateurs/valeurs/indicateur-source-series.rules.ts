type SerieValeur = {
  periodicite: string;
  dateValeur: string;
  metadonneeId?: number | null;
};

/**
 * Périodicités pour lesquelles deux versions d'une même source (métadonnées
 * différentes) portent une valeur à la même date : on ne peut alors pas les
 * fusionner en une seule série.
 */
export const getPeriodicitesAvecVersionsEnConflit = (
  valeurs: readonly SerieValeur[]
): Set<string> => {
  const versionParDate = new Map<string, number | null>();
  const enConflit = new Set<string>();
  for (const { periodicite, dateValeur, metadonneeId = null } of valeurs) {
    const key = `${periodicite}:${dateValeur}`;
    if (versionParDate.has(key) && versionParDate.get(key) !== metadonneeId) {
      enConflit.add(periodicite);
    }
    versionParDate.set(key, metadonneeId);
  }
  return enConflit;
};

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
