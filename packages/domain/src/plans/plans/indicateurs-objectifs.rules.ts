import { isNil } from 'es-toolkit';
import { IndicateurPeriodicite } from '../../indicateurs/indicateur/indicateur-periodicite.schema';
import { normalizeIndicateurReferenceObjectifs } from '../../indicateurs/valeurs/indicateur-reference-objectif.rules';
import { IndicateurPeriodes } from '../../indicateurs/valeurs/indicateur-periodes';
import { COLLECTIVITE_SOURCE_ID } from '../../indicateurs/valeurs/values.constants';

/** Valeur d'un indicateur pour la collectivité du plan, avec sa source éventuelle */
export type LigneValeurIndicateurObjectif = {
  periodicite: IndicateurPeriodicite;
  dateValeur: string;
  resultat: number | null;
  objectif: number | null;
  // `null` pour une valeur saisie par la collectivité
  metadonneeId: number | null;
  sourceId: string | null;
  ordreAffichage: number | null;
  dateVersion: string | null;
};

export type IndicateurDerniereValeur = {
  valeur: number;
  dateValeur: string;
  sourceId: string;
};

export type IndicateurObjectifHorizon = {
  valeur: number;
  annee: number;
};

export type IndicateurObjectif = {
  id: number;
  identifiantReferentiel: string | null;
  titre: string;
  unite: string;
  precision: number;
  periodicite: IndicateurPeriodicite;
  derniereValeur: IndicateurDerniereValeur | null;
  objectif: IndicateurObjectifHorizon | null;
};

const isFiniteNumber = (value: number | null | undefined): value is number =>
  !isNil(value) && Number.isFinite(value);

// comparaison de chaînes ISO : la plus récente en premier
const compareRecentFirst = (a: string | null, b: string | null) =>
  (b ?? '').localeCompare(a ?? '');

const compareOrdreSource = (
  a: LigneValeurIndicateurObjectif,
  b: LigneValeurIndicateurObjectif
) => {
  const ordreA = a.ordreAffichage ?? Number.POSITIVE_INFINITY;
  const ordreB = b.ordreAffichage ?? Number.POSITIVE_INFINITY;
  if (ordreA !== ordreB) {
    return ordreA < ordreB ? -1 : 1;
  }
  return (a.sourceId ?? '').localeCompare(b.sourceId ?? '');
};

/**
 * Dernier résultat à la périodicité de l'indicateur : celui de la collectivité
 * s'il en existe un, sinon celui de la source open data à l'`ordreAffichage`
 * minimal. Entre deux versions d'une même source, la plus récente l'emporte.
 */
export function pickDerniereValeur(
  lignes: LigneValeurIndicateurObjectif[],
  periodicite: IndicateurPeriodicite
): IndicateurDerniereValeur | null {
  const resultats = lignes.filter(
    (l) => l.periodicite === periodicite && isFiniteNumber(l.resultat)
  );

  const collectivite = resultats.filter((l) => l.metadonneeId === null);
  const openData = resultats.filter((l) => l.metadonneeId !== null);
  const [sourcePrioritaire] = openData.toSorted(compareOrdreSource);
  const candidates = collectivite.length
    ? collectivite
    : openData.filter((l) => l.sourceId === sourcePrioritaire?.sourceId);

  const [ligne] = candidates.toSorted(
    (a, b) =>
      compareRecentFirst(a.dateValeur, b.dateValeur) ||
      compareRecentFirst(a.dateVersion, b.dateVersion) ||
      (b.metadonneeId ?? 0) - (a.metadonneeId ?? 0)
  );
  if (!ligne || !isFiniteNumber(ligne.resultat)) {
    return null;
  }
  return {
    valeur: ligne.resultat,
    dateValeur: ligne.dateValeur,
    sourceId:
      ligne.metadonneeId === null
        ? COLLECTIVITE_SOURCE_ID
        : ligne.sourceId ?? COLLECTIVITE_SOURCE_ID,
  };
}

/**
 * Objectif saisi par la collectivité au prochain horizon annuel (année
 * courante comprise), sinon au dernier horizon passé. Les trajectoires open
 * data (SNBC…) ne sont jamais retenues.
 */
export function pickObjectif(
  lignes: LigneValeurIndicateurObjectif[],
  anneeCourante: number
): IndicateurObjectifHorizon | null {
  const horizons = normalizeIndicateurReferenceObjectifs(
    lignes.flatMap((l) =>
      l.metadonneeId === null && isFiniteNumber(l.objectif)
        ? [{ dateValeur: l.dateValeur, valeur: l.objectif }]
        : []
    )
  )
    .map(({ horizon, valeur }) => ({
      annee: Number(IndicateurPeriodes.serialize(horizon)),
      valeur,
    }))
    .toSorted((a, b) => a.annee - b.annee);

  return (
    horizons.find(({ annee }) => annee >= anneeCourante) ??
    horizons.at(-1) ??
    null
  );
}
