import { ExtractedAction } from '../models/extracted-action';
import { normalizeTitle } from '../pipeline/extract-actions/merge-chunk-actions';

// « 2.1.3 Titre », « 1- Titre », « 6/ Titre », « ACTION 3 - Titre », « Fiche
// n°12 : Titre » : le numéro sert au rattachement pendant l'import, pas au
// titre de la fiche. Un tiret ne sépare un numéro que s'il touche un blanc
// (« 2-roues » reste), et un nombre seul sans séparateur reste aussi
// (« 10 bornes de recharge »).
const TITLE_NUMBER =
  /^(?:(?:fiche(?:[\s-]*actions?)?|action|mesure)\b\s*(?:n[°º]\s*)?\d{1,3}(?:[.-]\d{1,3})*(?!\d)\s*[.)\-–—:]?\s*|\d{1,2}(?:\.\d{1,2}){1,3}\.?\s+|\d{1,2}(?:[.)/]\s*|\s*[-–—:]\s+|\s+[-–—:]\s*))(?=\p{L})/iu;

export const stripTitleNumber = (titre: string): string =>
  titre.replace(TITLE_NUMBER, '').trim();

/**
 * Retire le numéro des titres d'action, sauf quand deux actions du même axe
 * et du même sous-axe ne se distingueraient plus que par lui.
 */
export const stripTitleNumbers = (
  actions: ExtractedAction[]
): ExtractedAction[] => {
  const keyOf = (action: ExtractedAction, titre: string) =>
    [action.axe, action.sousAxe, normalizeTitle(titre)]
      .map((part) => part.trim())
      .join('|');
  const stripped = actions.map((action) => stripTitleNumber(action.titre));
  const counts = new Map<string, number>();
  actions.forEach((action, index) => {
    const key = keyOf(action, stripped[index]);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  return actions.map((action, index) => {
    const titre = stripped[index];
    return titre && counts.get(keyOf(action, titre)) === 1
      ? { ...action, titre }
      : action;
  });
};

const AXE_PREFIX = /^axe\s+(\d{1,2}|[IVX]{1,4})\b\s*[:.\-–—]?\s*/iu;
const SOUS_AXE_PREFIX = /^(\d{1,2}(?:\.\d{1,2})+)\.?\s*/u;

/**
 * Un même axe libellé de deux façons par deux extraits (« Axe 6 : DEVELOPPER
 * LE POTENTIEL » et « Axe 6 : Développer le potentiel ») deviendrait deux
 * axes dans le plan. Les libellés identiques aux accents et à la casse près
 * prennent une seule graphie, en casse normale de préférence ; un numéro nu
 * (« Axe 6 », « 6.2 ») rejoint le seul libellé complet de même numéro. Deux
 * titres différents de même numéro restent deux axes.
 */
export const unifyAxisLabels = (
  actions: ExtractedAction[]
): ExtractedAction[] => {
  const axes = unifyLabels(
    actions.map((action) => action.axe),
    AXE_PREFIX
  );
  const unifiedAxes = actions.map((action) => axes(action.axe));
  const sousAxesByAxe = new Map<string, (label: string) => string>();
  for (const axe of new Set(unifiedAxes)) {
    sousAxesByAxe.set(
      axe,
      unifyLabels(
        actions
          .filter((_, index) => unifiedAxes[index] === axe)
          .map((action) => action.sousAxe),
        SOUS_AXE_PREFIX
      )
    );
  }
  return actions.map((action, index) => {
    const axe = unifiedAxes[index];
    const sousAxes = sousAxesByAxe.get(axe);
    return {
      ...action,
      axe,
      sousAxe: sousAxes ? sousAxes(action.sousAxe) : action.sousAxe,
    };
  });
};

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
