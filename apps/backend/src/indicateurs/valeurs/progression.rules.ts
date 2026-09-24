import { isNil } from 'es-toolkit';

/** Ligne de valeur d'indicateur d'une collectivité, avec sa source éventuelle */
export type LigneValeurProgression = {
  // `null` pour une valeur saisie par la collectivité
  metadonneeId: number | null;
  sourceId: string | null;
  ordreAffichage: number | null;
  dateVersion: string | null;
  dateValeur: string;
  objectif: number | null;
  resultat: number | null;
};

const SOURCE_SNBC = 'snbc';

const getAnnee = (dateValeur: string) => Number(dateValeur.slice(0, 4));

const isFiniteNumber = (value: number | null | undefined): value is number =>
  !isNil(value) && Number.isFinite(value);

// comparaison de chaînes ISO : la plus récente en premier
const compareRecentFirst = (a: string | null, b: string | null) =>
  (b ?? '').localeCompare(a ?? '');

/**
 * Progression du résultat vers la valeur attendue :
 * `(valeurDepart - valeurUtilisee) / (valeurDepart - valeurAttendue)`.
 * Renvoie `null` si une valeur manque, si le dénominateur est nul ou si le
 * résultat n'est pas fini.
 */
export function computeProgression(
  valeurDepart: number | null | undefined,
  valeurAttendue: number | null | undefined,
  valeurUtilisee: number | null | undefined
): number | null {
  if (
    !isFiniteNumber(valeurDepart) ||
    !isFiniteNumber(valeurAttendue) ||
    !isFiniteNumber(valeurUtilisee)
  ) {
    return null;
  }
  const denominateur = valeurDepart - valeurAttendue;
  if (denominateur === 0) {
    return null;
  }
  const progression = (valeurDepart - valeurUtilisee) / denominateur;
  return Number.isFinite(progression) ? progression : null;
}

/**
 * Valeur attendue à `anneeUtilisee` pour une réduction de `reductionCible`
 * (0.4 = -40 %) entre `anneeDepart` et `anneeCible` :
 * `valeurDepart * (1 - reductionCible * avancementTemporel)`, avec un
 * avancement borné entre 0 et 1.
 */
export function computeValeurAttendue({
  valeurDepart,
  anneeDepart,
  anneeCible,
  reductionCible,
  anneeUtilisee,
}: {
  valeurDepart: number | null | undefined;
  anneeDepart: number | null | undefined;
  anneeCible: number | null | undefined;
  reductionCible: number | null | undefined;
  anneeUtilisee: number | null | undefined;
}): number | null {
  if (
    !isFiniteNumber(valeurDepart) ||
    !isFiniteNumber(anneeDepart) ||
    !isFiniteNumber(anneeCible) ||
    !isFiniteNumber(reductionCible) ||
    !isFiniteNumber(anneeUtilisee) ||
    anneeCible <= anneeDepart
  ) {
    return null;
  }
  const avancementTemporel = Math.min(
    1,
    Math.max(0, (anneeUtilisee - anneeDepart) / (anneeCible - anneeDepart))
  );
  const valeurAttendue =
    valeurDepart * (1 - reductionCible * avancementTemporel);
  return Number.isFinite(valeurAttendue) ? valeurAttendue : null;
}

/**
 * Objectif snbc de l'année : lignes de la source `snbc` ayant un objectif,
 * métadonnée à la `dateVersion` la plus récente puis `dateValeur` la plus
 * récente de l'année.
 */
export function pickObjectifSnbc(
  lignes: LigneValeurProgression[],
  annee: number
): number | null {
  const [ligne] = lignes
    .filter(
      (l) =>
        l.sourceId === SOURCE_SNBC &&
        isFiniteNumber(l.objectif) &&
        getAnnee(l.dateValeur) === annee
    )
    .sort(
      (a, b) =>
        compareRecentFirst(a.dateVersion, b.dateVersion) ||
        compareRecentFirst(a.dateValeur, b.dateValeur)
    );
  return ligne?.objectif ?? null;
}

/**
 * Résultat de l'année de départ : valeur de la collectivité si elle existe,
 * sinon celle de la source open data à l'`ordreAffichage` minimal (nul en
 * dernier, égalité départagée par `sourceId`). `dateValeur` la plus récente en
 * cas de doublon.
 */
export function pickValeurDepart(
  lignes: LigneValeurProgression[],
  annee: number
): number | null {
  const candidates = lignes.filter(
    (l) => isFiniteNumber(l.resultat) && getAnnee(l.dateValeur) === annee
  );

  const parPriorite = (a: LigneValeurProgression, b: LigneValeurProgression) =>
    compareRecentFirst(a.dateValeur, b.dateValeur) ||
    compareRecentFirst(a.dateVersion, b.dateVersion);

  const collectivite = candidates
    .filter((l) => l.metadonneeId === null)
    .sort(parPriorite);
  if (collectivite.length) {
    return collectivite[0].resultat;
  }

  const [ligne] = candidates
    .filter((l) => l.metadonneeId !== null)
    .sort((a, b) => {
      const ordreA = a.ordreAffichage ?? Number.POSITIVE_INFINITY;
      const ordreB = b.ordreAffichage ?? Number.POSITIVE_INFINITY;
      if (ordreA !== ordreB) {
        return ordreA < ordreB ? -1 : 1;
      }
      return (
        (a.sourceId ?? '').localeCompare(b.sourceId ?? '') || parPriorite(a, b)
      );
    });
  return ligne?.resultat ?? null;
}
