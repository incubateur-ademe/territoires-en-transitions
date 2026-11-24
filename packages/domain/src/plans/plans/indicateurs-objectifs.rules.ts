import { isNil } from 'es-toolkit';
import { deriveReferenceYearFromIndicateurValeurYears } from '../../demarches/pcaet/diagnostic/demarche-pcaet-diagnostic.rules';
import { IndicateurPeriodicite } from '../../indicateurs/indicateur/indicateur-periodicite.schema';
import { normalizeIndicateurReferenceObjectifs } from '../../indicateurs/valeurs/indicateur-reference-objectif.rules';
import { IndicateurPeriodes } from '../../indicateurs/valeurs/indicateur-periodes';
import { maskDernierResultat } from '../../indicateurs/valeurs/mask-dernier-resultat.rules';
import { computeProgression } from '../../indicateurs/valeurs/progression.rules';

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

/**
 * Pourquoi un indicateur est dans la liste : réglementaire du dépôt PCAET du
 * plan, lié à une fiche ou à un axe du plan, ou les deux.
 */
export type IndicateurObjectifSource = 'reglementaire' | 'plan';

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
  sources: IndicateurObjectifSource[];
  /** Le résultat de l'année de référence du dépôt PCAET, pour un réglementaire */
  departDepot: IndicateurValeurAnnee | null;
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

const toObjectifs = (
  lignes: Pick<LigneValeurIndicateurObjectif, 'dateValeur' | 'objectif'>[]
): IndicateurObjectifHorizon[] =>
  normalizeIndicateurReferenceObjectifs(
    lignes.flatMap((l) =>
      isFiniteNumber(l.objectif)
        ? [{ dateValeur: l.dateValeur, valeur: l.objectif }]
        : []
    )
  )
    .map(({ horizon, valeur }) => ({
      annee: Number(IndicateurPeriodes.serialize(horizon)),
      valeur,
    }))
    .toSorted((a, b) => a.annee - b.annee);

/**
 * Les objectifs saisis par la collectivité, un par année. Les trajectoires
 * open data (SNBC…) ne sont jamais retenues.
 */
export function listObjectifs(
  lignes: LigneValeurIndicateurObjectif[]
): IndicateurObjectifHorizon[] {
  return toObjectifs(lignes.filter((l) => l.metadonneeId === null));
}

/** Une valeur annuelle d'un indicateur saisie dans le dépôt PCAET. */
export type LigneValeurDepot = {
  dateValeur: string;
  resultat: number | null;
  objectif: number | null;
};

/**
 * Ce que le dépôt PCAET apporte à un indicateur réglementaire : ses objectifs,
 * et le résultat de l'année de référence du diagnostic comme départ. L'année
 * de référence n'est pas stockée : c'est la dernière année de résultat révolue
 * qui n'est pas un horizon d'objectif, comme dans le dépôt.
 */
export function buildDepot(
  lignes: LigneValeurDepot[],
  anneeCourante: number
): {
  departDepot: IndicateurValeurAnnee | null;
  objectifs: IndicateurObjectifHorizon[];
} {
  const resultats = lignes.flatMap((l) =>
    isFiniteNumber(l.resultat)
      ? [{ annee: Number(l.dateValeur.slice(0, 4)), valeur: l.resultat }]
      : []
  );
  const anneeReference = deriveReferenceYearFromIndicateurValeurYears({
    resultYears: resultats.map(({ annee }) => annee),
    currentYear: anneeCourante,
  });
  return {
    departDepot:
      resultats.find(({ annee }) => annee === anneeReference) ?? null,
    objectifs: toObjectifs(lignes),
  };
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

/**
 * Les réglementaires du dépôt PCAET d'abord, puis les favoris de la
 * collectivité, puis l'ordre alphabétique.
 */
export function compareIndicateursObjectifs(
  a: Pick<IndicateurObjectif, 'favori' | 'titre' | 'sources'>,
  b: Pick<IndicateurObjectif, 'favori' | 'titre' | 'sources'>
): number {
  const reglementaireA = a.sources.includes('reglementaire');
  const reglementaireB = b.sources.includes('reglementaire');
  if (reglementaireA !== reglementaireB) {
    return reglementaireA ? -1 : 1;
  }
  if (a.favori !== b.favori) {
    return a.favori ? -1 : 1;
  }
  return a.titre.localeCompare(b.titre, 'fr');
}

/** Une valeur datée à l'année : départ ou dernier résultat d'un indicateur. */
export type IndicateurValeurAnnee = {
  annee: number;
  valeur: number;
  /** Date complète du résultat, absente pour une valeur de dépôt sans date */
  dateValeur?: string;
};

const getAnneeResultat = ({ dateValeur }: IndicateurResultat) =>
  Number(dateValeur.slice(0, 4));

const toValeurAnnee = (
  point: IndicateurResultat | undefined
): IndicateurValeurAnnee | null =>
  point
    ? {
        annee: getAnneeResultat(point),
        valeur: point.valeur,
        dateValeur: point.dateValeur,
      }
    : null;

// deux résultats de la même année se départagent à la date complète
const estPosterieur = (
  valeur: IndicateurValeurAnnee,
  reference: IndicateurValeurAnnee
) =>
  valeur.annee !== reference.annee
    ? valeur.annee > reference.annee
    : valeur.dateValeur !== undefined &&
      reference.dateValeur !== undefined &&
      valeur.dateValeur > reference.dateValeur;

/**
 * La valeur de départ : celle du dépôt PCAET quand elle est connue (année de
 * référence du diagnostic), sinon le premier résultat de la série affichée.
 */
export function pickDepart(
  points: IndicateurResultat[],
  departDepot: IndicateurValeurAnnee | null = null
): IndicateurValeurAnnee | null {
  return departDepot ?? toValeurAnnee(points[0]);
}

/** Le dernier résultat de la série affichée. */
export function pickDernier(
  points: IndicateurResultat[]
): IndicateurValeurAnnee | null {
  return toValeurAnnee(points.at(-1));
}

export type AvancementObjectifEtat =
  | 'a-l-heure'
  | 'en-retard'
  | 'en-recul'
  | 'atteint'
  | 'echeance-atteinte'
  | 'echeance-manquee';

export type AvancementObjectif = {
  depart: IndicateurValeurAnnee;
  dernier: IndicateurValeurAnnee;
  cible: IndicateurObjectifHorizon;
  /** Part du chemin parcouru entre le départ et l'objectif, signée et non bornée */
  chemin: number;
  /** Part du temps écoulé entre l'année de départ et celle de l'objectif, de 0 à 1 */
  tempsEcoule: number;
  /** Évolution du dernier résultat par rapport au départ, `null` si départ nul */
  evolutionDepuisDepart: number | null;
  /** Évolution visée par l'objectif par rapport au départ, `null` si départ nul */
  evolutionObjectif: number | null;
  etat: AvancementObjectifEtat;
};

const evolution = (depart: number, valeur: number) =>
  depart === 0 ? null : (valeur - depart) / Math.abs(depart);

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * L'évolution visée par l'objectif par rapport au départ, comme dans le dépôt
 * (« −41 % par rapport à 2015 »). Elle se lit même sans barre de chemin
 * parcouru. `null` sans départ, depuis un départ nul, ou si l'objectif n'est
 * pas postérieur au départ.
 */
export function computeEvolutionObjectif(
  depart: IndicateurValeurAnnee | null,
  cible: IndicateurObjectifHorizon | null
): number | null {
  if (!depart || !cible || cible.annee <= depart.annee) {
    return null;
  }
  return evolution(depart.valeur, cible.valeur);
}

/**
 * Où en est un indicateur de son objectif. Le chemin parcouru vaut
 * `(dernier - départ) / (objectif - départ)`, valable à la hausse comme à la
 * baisse ; il est comparé au temps écoulé pour dire si l'indicateur tient le
 * rythme d'une trajectoire linéaire.
 *
 * `null` (pas de barre) si une valeur manque, si le départ est déjà l'objectif,
 * si l'objectif n'est pas postérieur au départ, ou si aucun résultat n'est
 * postérieur au départ : il n'y a encore rien à mesurer.
 */
export function computeAvancementObjectif({
  depart,
  dernier,
  cible,
  anneeCourante,
}: {
  depart: IndicateurValeurAnnee | null;
  dernier: IndicateurValeurAnnee | null;
  cible: IndicateurObjectifHorizon | null;
  anneeCourante: number;
}): AvancementObjectif | null {
  if (
    !depart ||
    !dernier ||
    !cible ||
    cible.annee <= depart.annee ||
    !estPosterieur(dernier, depart)
  ) {
    return null;
  }
  // `computeProgression(départ, attendue, utilisée)` vaut
  // `(départ - utilisée) / (départ - attendue)` : null si départ = objectif.
  const chemin = computeProgression(
    depart.valeur,
    cible.valeur,
    dernier.valeur
  );
  if (chemin === null) {
    return null;
  }
  const tempsEcoule = clamp01(
    (dernier.annee - depart.annee) / (cible.annee - depart.annee)
  );
  return {
    depart,
    dernier,
    cible,
    chemin,
    tempsEcoule,
    evolutionDepuisDepart: evolution(depart.valeur, dernier.valeur),
    evolutionObjectif: computeEvolutionObjectif(depart, cible),
    etat: getEtat({
      chemin,
      tempsEcoule,
      echeancePassee: anneeCourante > cible.annee,
    }),
  };
}

function getEtat({
  chemin,
  tempsEcoule,
  echeancePassee,
}: {
  chemin: number;
  tempsEcoule: number;
  echeancePassee: boolean;
}): AvancementObjectifEtat {
  if (echeancePassee) {
    return chemin >= 1 ? 'echeance-atteinte' : 'echeance-manquee';
  }
  if (chemin >= 1) {
    return 'atteint';
  }
  if (chemin < 0) {
    return 'en-recul';
  }
  return chemin >= tempsEcoule ? 'a-l-heure' : 'en-retard';
}
