import type { ActionLevel } from '../../models/import-question';
import {
  titleIncludes,
  titlesMatch,
} from '../../pipeline/extract-actions/similar-titles';
import type { DocumentUnit } from '../../pipeline/segment-document/document-unit';
import {
  ManualReference,
  ManualReferenceAction,
  referenceAtActionLevel,
} from '../eval-metrics';

/**
 * Ce que le découpage transmet au modèle, comparé au plan attendu : chaque
 * action attendue doit ouvrir une unité de fiche, à son titre, avec son
 * numéro, sous son chemin d'axes. C'est le plan que le modèle ne peut pas
 * deviner si le code le perd.
 */
export type SegmentationScore = {
  attendues: number;
  /** Une unité de fiche porte ce titre, même écourté. */
  trouvees: number;
  /** … avec tous les mots du titre attendu. */
  titresComplets: number;
  /** Actions attendues qui ont un numéro dans le document. */
  numerosAttendus: number;
  /** … retrouvées avec ce numéro en tête de leur titre. */
  numeros: number;
  /** … rangées sous le bon axe. */
  bonAxe: number;
  /**
   * … sous le chemin attendu en entier (axe, puis sous-axe s'il y en a). Un
   * libellé d'axe écourté désigne encore le bon parent : il est compté par
   * `axesComplets`.
   */
  bonChemin: number;
  /** Unités de fiche qui ne répondent à aucune action attendue. */
  enTrop: number;
  axesAttendus: number;
  /** Axes attendus en tête du chemin d'au moins une unité. */
  axesTrouves: number;
  /** … avec tous les mots de leur libellé. */
  axesComplets: number;
};

export type SegmentationDetail = {
  manquantes: string[];
  titresEcourtes: { attendu: string; obtenu: string }[];
  numerosPerdus: { titre: string; attendu: string; obtenu: string }[];
  malRangees: { titre: string; attendu: string; obtenu: string }[];
  enTrop: string[];
  axesManquants: string[];
  axesEcourtes: { attendu: string; obtenu: string }[];
};

// Un titre écourté à moins de trois mots ne désigne plus rien.
const MIN_TRUNCATED_WORDS = 3;

export const scoreSegmentation = (
  units: DocumentUnit[],
  reference: ManualReference,
  actionLevel: ActionLevel
): { score: SegmentationScore; detail: SegmentationDetail } => {
  const expected = referenceAtActionLevel(reference, actionLevel).actions;
  // Une fiche trop longue est fenêtrée : seule sa première fenêtre l'ouvre.
  const fiches = units.filter(
    (unit) => unit.kind === 'fiche' && !unit.continued && unit.title
  );
  const matches = matchFiches(expected, fiches);
  const found = matches.filter(
    (match): match is { expected: ManualReferenceAction; unit: DocumentUnit } =>
      match.unit !== undefined
  );
  const taken = new Set(found.map(({ unit }) => unit));
  const withNumber = found.filter(({ expected }) => expected.numero);
  const misplaced = found.filter(
    ({ expected, unit }) => !pathsMatch(unit.headingPath, pathOf(expected))
  );
  const axeLabels = [
    ...new Set(units.flatMap((unit) => unit.headingPath.slice(0, 1))),
  ];
  const missingAxes = reference.axes.filter(
    (axe) => !axeLabels.some((label) => sameLabel(label, axe))
  );
  const truncatedAxes = reference.axes.flatMap((axe) => {
    const labels = axeLabels.filter((label) => sameLabel(label, axe));
    return labels.length > 0 &&
      !labels.some((label) => titleIncludes(label, axe))
      ? [{ attendu: axe, obtenu: labels[0] }]
      : [];
  });

  return {
    score: {
      attendues: expected.length,
      trouvees: found.length,
      titresComplets: found.filter(({ expected, unit }) =>
        titleIncludes(titleOf(unit), expected.titre)
      ).length,
      numerosAttendus: expected.filter((action) => action.numero).length,
      numeros: withNumber.filter(({ expected, unit }) =>
        sameNumber(titleOf(unit), expected.numero ?? '')
      ).length,
      bonAxe: found.filter(({ expected, unit }) =>
        sameLabel(unit.headingPath[0] ?? '', expected.axe)
      ).length,
      bonChemin: found.length - misplaced.length,
      enTrop: fiches.length - taken.size,
      axesAttendus: reference.axes.length,
      axesTrouves: reference.axes.length - missingAxes.length,
      axesComplets:
        reference.axes.length - missingAxes.length - truncatedAxes.length,
    },
    detail: {
      manquantes: matches
        .filter(({ unit }) => unit === undefined)
        .map(({ expected }) => labelOf(expected)),
      titresEcourtes: found
        .filter(
          ({ expected, unit }) => !titleIncludes(titleOf(unit), expected.titre)
        )
        .map(({ expected, unit }) => ({
          attendu: expected.titre,
          obtenu: titleOf(unit),
        })),
      numerosPerdus: withNumber
        .filter(
          ({ expected, unit }) =>
            !sameNumber(titleOf(unit), expected.numero ?? '')
        )
        .map(({ expected, unit }) => ({
          titre: expected.titre,
          attendu: expected.numero ?? '',
          obtenu: leadingNumber(titleOf(unit)) ?? '',
        })),
      malRangees: misplaced.map(({ expected, unit }) => ({
        titre: labelOf(expected),
        attendu: pathOf(expected).join(' > '),
        obtenu: unit.headingPath.join(' > '),
      })),
      enTrop: fiches.filter((unit) => !taken.has(unit)).map(titleOf),
      axesManquants: missingAxes,
      axesEcourtes: truncatedAxes,
    },
  };
};

/**
 * Une unité ne répond qu'à une action attendue. Les unités bien rangées
 * d'abord : deux fiches homonymes sous deux axes en demandent deux.
 */
const matchFiches = (
  expected: ManualReferenceAction[],
  fiches: DocumentUnit[]
): { expected: ManualReferenceAction; unit: DocumentUnit | undefined }[] => {
  const taken = new Set<DocumentUnit>();
  const take = (
    action: ManualReferenceAction,
    accepts: (unit: DocumentUnit) => boolean
  ): DocumentUnit | undefined => {
    const unit = fiches.find(
      (candidate) => !taken.has(candidate) && accepts(candidate)
    );
    if (unit) {
      taken.add(unit);
    }
    return unit;
  };
  const sameTitle = (action: ManualReferenceAction) => (unit: DocumentUnit) =>
    sameLabel(titleOf(unit), action.titre);
  const firstPass = expected.map((action) =>
    take(
      action,
      (unit) =>
        sameTitle(action)(unit) && pathsMatch(unit.headingPath, pathOf(action))
    )
  );
  return expected.map((action, index) => ({
    expected: action,
    unit: firstPass[index] ?? take(action, sameTitle(action)),
  }));
};

/** Le même libellé, au besoin écourté : la mise en page coupe les titres. */
const sameLabel = (actual: string, expected: string): boolean => {
  const title = withoutNumber(actual);
  return (
    titlesMatch(actual, expected) ||
    (title.split(/\s+/u).length >= MIN_TRUNCATED_WORDS &&
      titleIncludes(expected, title))
  );
};

const titleOf = (unit: DocumentUnit): string => unit.title ?? '';

const pathOf = (action: ManualReferenceAction): string[] =>
  action.cheminAxes ?? [action.axe];

const pathsMatch = (actual: string[], expected: string[]): boolean =>
  actual.length === expected.length &&
  actual.every((segment, index) => sameLabel(segment, expected[index]));

const labelOf = (action: ManualReferenceAction): string =>
  action.numero ? `${action.numero} ${action.titre}` : action.titre;

// « 1.2 », « 14 », « A 5 », « A » ou « B.3 » en tête du titre, suivi d'un
// séparateur.
const LEADING_NUMBER =
  /^\s*((?:[A-Z]\s?)?\d+(?:\.\d+)*|[A-Z](?:\.\d+)*)\.?(?=[\s:–—-])/u;

/** Sans espace : « A 5 » et « A5 » sont le même numéro. */
const leadingNumber = (title: string): string | null =>
  LEADING_NUMBER.exec(title)?.[1].replace(/\s/gu, '') ?? null;

const sameNumber = (title: string, numero: string): boolean =>
  leadingNumber(title) === numero.replace(/\s/gu, '');

const withoutNumber = (title: string): string =>
  title.replace(LEADING_NUMBER, '').replace(/^[\s.:–—-]+/u, '');
