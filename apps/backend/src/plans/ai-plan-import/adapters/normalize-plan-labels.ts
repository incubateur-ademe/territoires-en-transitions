import {
  axisSlotsOf,
  ExtractedAction,
  withAxisPath,
} from '../models/extracted-action';
import { normalizeTitle } from '../pipeline/extract-actions/merge-chunk-actions';

// « 2.1.3 Titre », « 1- Titre », « 6/ Titre », « ACTION 3 - Titre », « Fiche
// n°12 : Titre » : le numéro d'une fiche. Un tiret ne sépare un numéro que
// s'il touche un blanc (« 2-roues » reste), et un nombre seul sans séparateur
// n'en est pas un (« 10 bornes de recharge »).
const TITLE_NUMBER =
  /^(?:(?:fiche(?:[\s-]*actions?)?|action|mesure)\b\s*(?:n[°º]\s*)?\d{1,3}(?:[.-]\d{1,3})*(?!\d)\s*[.)\-–—:]?\s*|\d{1,2}(?:\.\d{1,2}){1,3}\.?\s+|\d{1,2}(?:[.)/]\s*|\s*[-–—:]\s+|\s+[-–—:]\s*))(?=\p{L})/iu;

export const stripTitleNumber = (titre: string): string =>
  titre.replace(TITLE_NUMBER, '').trim();

/**
 * Le numéro de la fiche reste en tête de son titre, sous une seule forme :
 * « Fiche n°12 : Titre » et « ACTION 12 - Titre » deviennent « 12 Titre »,
 * « 2.1.3. Titre » devient « 2.1.3 Titre ». Il fait le lien avec le document
 * et garde l'ordre de ses fiches.
 */
export const normalizeTitleNumber = (titre: string): string => {
  const prefix = titre.match(TITLE_NUMBER)?.[0];
  const number = prefix?.match(/\d{1,3}(?:[.-]\d{1,3})*/u)?.[0];
  return prefix && number
    ? `${number} ${titre.slice(prefix.length).trim()}`
    : titre;
};

export const normalizeTitleNumbers = (
  actions: ExtractedAction[]
): ExtractedAction[] =>
  actions.map((action) => ({
    ...action,
    titre: normalizeTitleNumber(action.titre),
  }));

const AXE_PREFIX = /^axe\s+(\d{1,2}|[IVX]{1,4})\b\s*[:.\-–—]?\s*/iu;
const SOUS_AXE_PREFIX = /^(\d{1,2}(?:\.\d{1,2})+)\.?\s*/u;

/**
 * Un même axe libellé de deux façons par deux extraits (« Axe 6 : DEVELOPPER
 * LE POTENTIEL » et « Axe 6 : Développer le potentiel ») deviendrait deux
 * axes dans le plan. Les libellés identiques aux accents et à la casse près
 * prennent une seule graphie, en casse normale de préférence ; un numéro nu
 * (« Axe 6 », « 6.2 ») rejoint le seul libellé complet de même numéro. Deux
 * titres différents de même numéro restent deux axes. Chaque niveau s'unifie
 * parmi les libellés qui partagent le même chemin au-dessus de lui.
 */
export const unifyAxisLabels = (
  extracted: ExtractedAction[]
): ExtractedAction[] => {
  const paths = extracted.map((action) =>
    axisSlotsOf(action).map(collapseSpaces)
  );
  const depth = Math.max(0, ...paths.map((path) => path.length));
  for (let level = 0; level < depth; level++) {
    const unifyByParent = new Map<string, (label: string) => string>();
    const parentKeyOf = (path: string[]) =>
      JSON.stringify(path.slice(0, level));
    for (const parentKey of new Set(
      paths.filter((path) => level < path.length).map(parentKeyOf)
    )) {
      unifyByParent.set(
        parentKey,
        unifyLabels(
          paths
            .filter(
              (path) => level < path.length && parentKeyOf(path) === parentKey
            )
            .map((path) => path[level]),
          level === 0 ? AXE_PREFIX : SOUS_AXE_PREFIX
        )
      );
    }
    for (const path of paths) {
      const unify = unifyByParent.get(parentKeyOf(path));
      if (level < path.length && unify) {
        path[level] = unify(path[level]);
      }
    }
  }
  return extracted.map((action, index) => {
    const path = paths[index];
    return action.cheminAxes
      ? withAxisPath(action, path)
      : { ...action, axe: path[0], sousAxe: path[1] };
  });
};

const collapseSpaces = (label: string): string =>
  label.replace(/\s+/g, ' ').trim();

const unifyLabels = (
  labels: string[],
  prefix: RegExp
): ((label: string) => string) => {
  const numberOf = (label: string) =>
    label.trim().match(prefix)?.[1].toUpperCase() ?? null;
  const titleOf = (label: string) => label.trim().replace(prefix, '');

  const countsByKey = new Map<string, Map<string, number>>();
  for (const label of labels.map((label) => label.trim())) {
    if (!titleOf(label)) {
      continue;
    }
    const key = normalizeTitle(label);
    const counts = countsByKey.get(key) ?? new Map<string, number>();
    counts.set(label, (counts.get(label) ?? 0) + 1);
    countsByKey.set(key, counts);
  }
  const chosenByKey = new Map(
    [...countsByKey].map(([key, counts]) => [
      key,
      [...counts].sort(
        ([labelA, countA], [labelB, countB]) =>
          Number(isAllCaps(titleOf(labelA))) -
            Number(isAllCaps(titleOf(labelB))) || countB - countA
      )[0][0],
    ])
  );
  const titledByNumber = new Map<string, Set<string>>();
  for (const chosen of chosenByKey.values()) {
    const number = numberOf(chosen);
    if (number) {
      titledByNumber.set(
        number,
        new Set([...(titledByNumber.get(number) ?? []), chosen])
      );
    }
  }

  return (label: string) => {
    const trimmed = label.trim();
    if (!trimmed) {
      return label;
    }
    if (titleOf(trimmed)) {
      return chosenByKey.get(normalizeTitle(trimmed)) ?? label;
    }
    const number = numberOf(trimmed);
    const titled = number ? titledByNumber.get(number) : undefined;
    return titled?.size === 1 ? [...titled][0] : label;
  };
};

const isAllCaps = (title: string): boolean => {
  const letters = title.replace(/[^\p{L}]/gu, '');
  return letters.length > 0 && letters === letters.toUpperCase();
};
