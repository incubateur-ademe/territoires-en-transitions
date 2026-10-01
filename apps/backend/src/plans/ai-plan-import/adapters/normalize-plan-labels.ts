import { ExtractedAction } from '../models/extracted-action';
import { normalizeTitle } from '../pipeline/extract-actions/merge-chunk-actions';

// « 2.1.3 Titre », « 1- Titre », « ACTION 3 - Titre », « Fiche n°12 : Titre » :
// le numéro sert au rattachement pendant l'import, pas au titre de la fiche.
// Un nombre seul sans séparateur reste (« 10 bornes de recharge »).
const TITLE_NUMBER =
  /^(?:(?:fiche(?:[\s-]*actions?)?|action|mesure)\s*(?:n[°º]\s*)?[A-Z]{0,3}[\s-]?\d+(?:[.-]\d+)*\s*[.)\-–—:]?\s*|\d{1,2}(?:\.\d{1,2}){1,3}\.?\s+|\d{1,2}\s*[.)\-–—:]\s*)(?=\p{L})/iu;

export const stripTitleNumber = (titre: string): string =>
  titre.replace(TITLE_NUMBER, '').trim();

const AXE_NUMBER = /^axe\s+(\d{1,2}|[IVX]{1,4})\b/iu;
const SOUS_AXE_NUMBER = /^(\d{1,2}(?:\.\d{1,2})+)\b/u;

/**
 * Un même axe libellé de deux façons par deux extraits (« Axe 6 : DEVELOPPER
 * LE POTENTIEL » et « Axe 6 : Développer le potentiel ») deviendrait deux
 * axes dans le plan. Les libellés de même numéro, ou identiques aux accents
 * et à la casse près, prennent une seule graphie : celle en casse normale,
 * sinon la plus fréquente.
 */
export const unifyAxisLabels = (
  actions: ExtractedAction[]
): ExtractedAction[] => {
  const axeKey = (action: ExtractedAction) =>
    action.axe.match(AXE_NUMBER)?.[1].toUpperCase() ??
    normalizeTitle(action.axe);
  const sousAxeKey = (action: ExtractedAction) =>
    `${axeKey(action)}|${
      action.sousAxe.match(SOUS_AXE_NUMBER)?.[1] ??
      normalizeTitle(action.sousAxe)
    }`;
  const axeLabels = pickLabels(actions, axeKey, (action) => action.axe);
  const sousAxeLabels = pickLabels(
    actions,
    sousAxeKey,
    (action) => action.sousAxe
  );
  return actions.map((action) => ({
    ...action,
    axe: axeLabels.get(axeKey(action)) ?? action.axe,
    sousAxe: sousAxeLabels.get(sousAxeKey(action)) ?? action.sousAxe,
  }));
};

const pickLabels = (
  actions: ExtractedAction[],
  keyOf: (action: ExtractedAction) => string,
  labelOf: (action: ExtractedAction) => string
): Map<string, string> => {
  const countsByKey = new Map<string, Map<string, number>>();
  for (const action of actions) {
    const label = labelOf(action).trim();
    if (!label) {
      continue;
    }
    const counts = countsByKey.get(keyOf(action)) ?? new Map<string, number>();
    counts.set(label, (counts.get(label) ?? 0) + 1);
    countsByKey.set(keyOf(action), counts);
  }
  return new Map(
    [...countsByKey].map(([key, counts]) => [
      key,
      [...counts].sort(
        ([labelA, countA], [labelB, countB]) =>
          Number(isAllCaps(labelA)) - Number(isAllCaps(labelB)) ||
          countB - countA
      )[0][0],
    ])
  );
};

const isAllCaps = (label: string): boolean => {
  const letters = label.replace(AXE_NUMBER, '').replace(/[^\p{L}]/gu, '');
  return letters.length > 0 && letters === letters.toUpperCase();
};
