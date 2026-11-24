import { isNil } from 'es-toolkit';
import { IndicateurPeriodicite } from '../../indicateurs/indicateur/indicateur-periodicite.schema';
import { normalizeIndicateurReferenceObjectifs } from '../../indicateurs/valeurs/indicateur-reference-objectif.rules';
import { IndicateurPeriodes } from '../../indicateurs/valeurs/indicateur-periodes';
import { maskDernierResultat } from '../../indicateurs/valeurs/mask-dernier-resultat.rules';

/** Valeur d'un indicateur pour la collectivité du plan, avec sa source éventuelle */
export type LigneValeurIndicateurObjectif = {
  periodicite: IndicateurPeriodicite;
  dateValeur: string;
  resultat: number | null;
  objectif: number | null;
  // `null` pour une valeur saisie par la collectivité
  metadonneeId: number | null;
  sourceId: string | null;
  sourceLibelle: string | null;
  ordreAffichage: number | null;
  dateVersion: string | null;
};

export type IndicateurResultat = { dateValeur: string; valeur: number };

export type IndicateurObjectifHorizon = { annee: number; valeur: number };

/** D'où viennent les résultats affichés : la collectivité, sinon l'open data. */
export type IndicateurResultatsSource =
  | { type: 'collectivite' }
  | { type: 'open-data'; libelle: string };

export type IndicateurResultats = {
  source: IndicateurResultatsSource;
  points: IndicateurResultat[];
};

export type IndicateurObjectif = {
  id: number;
  identifiantReferentiel: string | null;
  titre: string;
  unite: string;
  precision: number;
  periodicite: IndicateurPeriodicite;
  favori: boolean;
  resultats: IndicateurResultats | null;
  objectifs: IndicateurObjectifHorizon[];
};

/** Les horizons proposés au choix, ceux des objectifs du dépôt PCAET. */
export const INDICATEURS_OBJECTIFS_HORIZONS = [2030, 2036, 2050] as const;

export type IndicateursObjectifsHorizon =
  (typeof INDICATEURS_OBJECTIFS_HORIZONS)[number];

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
 * Les résultats d'une seule source, à la périodicité de l'indicateur : ceux de
 * la collectivité s'il y en a, sinon ceux de la source open data à
 * l'`ordreAffichage` minimal. Une date publiée par plusieurs versions de la
 * source garde la plus récente.
 *
 * `maskDernierResultatCollectivite` retire le dernier résultat de la
 * collectivité (indicateur confidentiel, lecteur sans droit). La source reste
 * celle de la collectivité même si plus rien n'en est visible : basculer sur
 * l'open data ferait croire qu'elle n'a rien saisi.
 */
export function pickResultats(
  lignes: LigneValeurIndicateurObjectif[],
  periodicite: IndicateurPeriodicite,
  { maskDernierResultatCollectivite = false } = {}
): IndicateurResultats | null {
  const resultats = lignes.filter(
    (l) => l.periodicite === periodicite && isFiniteNumber(l.resultat)
  );
  const saisies = resultats.filter((l) => l.metadonneeId === null);
  const openData = resultats.filter((l) => l.metadonneeId !== null);
  const [sourcePrioritaire] = openData.toSorted(compareOrdreSource);

  if (saisies.length) {
    const collectivite = maskDernierResultatCollectivite
      ? maskDernierResultat(saisies).filter((l) => isFiniteNumber(l.resultat))
      : saisies;
    if (!collectivite.length) {
      return null;
    }
    return {
      source: { type: 'collectivite' },
      points: toPoints(collectivite),
    };
  }

  const retenues = openData.filter(
    (l) => l.sourceId === sourcePrioritaire?.sourceId
  );
  if (!retenues.length) {
    return null;
  }
  return {
    source: {
      type: 'open-data',
      libelle:
        sourcePrioritaire?.sourceLibelle ?? sourcePrioritaire?.sourceId ?? '',
    },
    points: toPoints(retenues),
  };
}

// Une date publiée par plusieurs versions d'une source garde la plus récente.
const toPoints = (
  lignes: LigneValeurIndicateurObjectif[]
): IndicateurResultat[] => {
  const parDate = new Map<string, LigneValeurIndicateurObjectif>();
  lignes
    .toSorted(
      (a, b) =>
        compareRecentFirst(a.dateVersion, b.dateVersion) ||
        (b.metadonneeId ?? 0) - (a.metadonneeId ?? 0)
    )
    .forEach((l) => {
      if (!parDate.has(l.dateValeur)) {
        parDate.set(l.dateValeur, l);
      }
    });
  return [...parDate.values()]
    .map((l) => ({ dateValeur: l.dateValeur, valeur: l.resultat as number }))
    .toSorted((a, b) => a.dateValeur.localeCompare(b.dateValeur));
};

/**
 * Les objectifs saisis par la collectivité, un par année. Les trajectoires
 * open data (SNBC…) ne sont jamais retenues.
 */
export function listObjectifs(
  lignes: LigneValeurIndicateurObjectif[]
): IndicateurObjectifHorizon[] {
  return normalizeIndicateurReferenceObjectifs(
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
}

/** L'objectif retenu pour un horizon : le dernier fixé jusqu'à cet horizon. */
export function pickObjectifAHorizon(
  objectifs: IndicateurObjectifHorizon[],
  horizon: number
): IndicateurObjectifHorizon | null {
  return objectifs.filter(({ annee }) => annee <= horizon).at(-1) ?? null;
}

/** Le prochain horizon, année courante comprise, sinon le dernier. */
export function getHorizonParDefaut(
  anneeCourante: number
): IndicateursObjectifsHorizon {
  return (
    INDICATEURS_OBJECTIFS_HORIZONS.find((h) => h >= anneeCourante) ??
    INDICATEURS_OBJECTIFS_HORIZONS[INDICATEURS_OBJECTIFS_HORIZONS.length - 1]
  );
}

/** Les favoris de la collectivité d'abord, puis l'ordre alphabétique. */
export function compareIndicateursObjectifs(
  a: Pick<IndicateurObjectif, 'favori' | 'titre'>,
  b: Pick<IndicateurObjectif, 'favori' | 'titre'>
): number {
  if (a.favori !== b.favori) {
    return a.favori ? -1 : 1;
  }
  return a.titre.localeCompare(b.titre, 'fr');
}
