import type {
  DemarchePcaetDiagnosticPayload,
  DemarchePcaetTopic,
  DemarchePcaetTopicLeaf,
} from './demarche-pcaet-diagnostic.schema';
import { DemarchePcaetTopicKindEnum } from './demarche-pcaet-topic-kind.enum.schema';

/** Borne basse d'une année saisissable dans le diagnostic. */
export const REFERENCE_YEAR_MIN = 2010;

/**
 * Plafond du nombre d'années ajoutées. Chaque année ouvre une colonne pour
 * toutes les lignes du topic — 60 pour les polluants — et entre dans la photo
 * transmise : la souplesse reste bornée.
 */
export const MAX_EXTRA_YEARS = 10;

/** Colonnes de la grille d'un topic. */
export const buildTopicYears = ({
  referenceYear,
  horizons,
  extraYears = [],
}: {
  referenceYear: number;
  horizons: readonly number[];
  extraYears?: readonly number[];
}): number[] =>
  [...new Set([referenceYear, ...horizons, ...extraYears])].sort(
    (a, b) => a - b
  );

/**
 * Une année ajoutée sert soit à porter un résultat — les inventaires ne sortent
 * pas la même année selon les secteurs — soit à se fixer un jalon intermédiaire.
 * Elle vit donc de la borne basse au dernier horizon réglementaire.
 */
export const isDiagnosticYearInBounds = ({
  year,
  horizons,
}: {
  year: number;
  horizons: readonly number[];
}): boolean =>
  year >= REFERENCE_YEAR_MIN &&
  year <= Math.max(...horizons, REFERENCE_YEAR_MIN);

/**
 * Années ajoutées telles qu'elles sont persistées : dédoublonnées, triées, et
 * débarrassées de ce que la grille affiche déjà. Sans quoi déplacer l'année de
 * comptabilisation sur une année ajoutée la rendrait supprimable.
 */
export const normalizeExtraYears = ({
  extraYears,
  referenceYear,
  horizons,
}: {
  extraYears: readonly number[];
  referenceYear: number;
  horizons: readonly number[];
}): number[] =>
  [...new Set(extraYears)]
    .filter((year) => year !== referenceYear && !horizons.includes(year))
    .sort((a, b) => a - b);

/**
 * Année de comptabilisation proposée à défaut de choix de la collectivité : la
 * plus récente pour laquelle un résultat existe. Les inventaires réglementaires
 * ayant deux à trois ans de retard, proposer l'année courante rendrait la
 * complétude inatteignable.
 */
export const deriveReferenceYear = ({
  resultYears,
  currentYear,
}: {
  resultYears: readonly number[];
  currentYear: number;
}): number => {
  const eligible = resultYears.filter(
    (year) => year >= REFERENCE_YEAR_MIN && year <= currentYear
  );
  return eligible.length === 0 ? currentYear : Math.max(...eligible);
};

/** Lignes des deux niveaux à plat. */
const allRows = (topic: DemarchePcaetTopic): DemarchePcaetTopicLeaf[] =>
  topic.rows.flatMap((row) => [row, ...row.rows]);

/**
 * Une ligne requise sans indicateur résolu ne peut pas être renseignée : elle
 * relève d'un trou du référentiel indicateurs, que le serveur journalise, et ne
 * bloque pas le dépôt.
 */
const requiredRows = (topic: DemarchePcaetTopic): DemarchePcaetTopicLeaf[] =>
  allRows(topic).filter((row) => row.requis && row.indicateurId !== null);

/**
 * Un volet dont aucune saisie n'est obligatoire : il ne conditionne donc ni la
 * complétude de l'étape diagnostic ni la transmission, et s'annonce comme
 * optionnel plutôt que comme achevé. Deux volets sont dans ce cas — la
 * vulnérabilité du territoire, où le cadre de dépôt ne rend rien obligatoire,
 * pas même une thématique du socle, et les énergies renouvelables, dont aucune
 * filière n'est requise tant que leur mapping n'est pas arrêté.
 */
export const isDemarchePcaetTopicOptional = (
  topic: DemarchePcaetTopic
): boolean =>
  topic.kind !== DemarchePcaetTopicKindEnum.INDICATEURS ||
  allRows(topic).every((row) => !row.requis);

/**
 * Un topic est complet quand chacune de ses lignes requises porte un constat et
 * une cible : un résultat sur l'année de comptabilisation et un objectif sur au
 * moins un horizon. Les années ajoutées ouvrent des colonnes sans rien exiger.
 * Un topic qui n'exige rien est complet, faute de quoi il retiendrait le
 * dossier sur une saisie qu'on ne lui demande pas — voir
 * `isDemarchePcaetTopicOptional`, qui décide de l'affichage de ces volets.
 */
export const isDemarchePcaetTopicComplet = (
  topic: DemarchePcaetTopic
): boolean => {
  if (topic.kind !== DemarchePcaetTopicKindEnum.INDICATEURS) {
    return true;
  }
  const horizons = new Set(topic.horizons);
  return requiredRows(topic).every((row) => {
    const valeurs = topic.valeurs.filter(
      (valeur) => valeur.indicateurId === row.indicateurId
    );
    const hasResultat = valeurs.some(
      (valeur) =>
        valeur.year === topic.referenceYear && valeur.resultat !== null
    );
    const hasObjectif = valeurs.some(
      (valeur) => horizons.has(valeur.year) && valeur.objectif !== null
    );
    return hasResultat && hasObjectif;
  });
};

/**
 * Complétude de l'étape diagnostic du dossier, condition de la transmission
 * pour avis. Seuls comptent les topics qui exigent quelque chose : le front et
 * le guard serveur appliquent cette règle au même objet, ils ne peuvent donc
 * pas rendre deux verdicts.
 */
export const isDemarchePcaetDiagnosticComplet = (
  diagnostic: DemarchePcaetDiagnosticPayload
): boolean =>
  diagnostic.topics.length > 0 &&
  diagnostic.topics.every(isDemarchePcaetTopicComplet);
