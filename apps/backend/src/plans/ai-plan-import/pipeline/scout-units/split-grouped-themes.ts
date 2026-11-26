import type { ThemeGroup } from '../../models/import-question';
import type { PlanSkeleton } from '../../models/plan-skeleton';
import { titleIncludes, titlesMatch } from '../extract-actions/similar-titles';

type Axe = PlanSkeleton['axes'][number];

const wordsKey = (text: string): string =>
  (
    text
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu) ?? []
  ).join(' ');

/**
 * L'utilisateur veut un axe par thème écrit sur les fiches : un axe qui les
 * réunit malgré la consigne (« Biodéchets : restes alimentaires et
 * végétaux ») redevient un axe par thème, à sa place, dans l'ordre du
 * document. Les variantes sont proches par construction : seuls les mêmes mots
 * désignent l'une d'elles, jamais un titre ressemblant.
 */
export const splitGroupedThemes = (
  skeleton: PlanSkeleton,
  groups: ThemeGroup[]
): PlanSkeleton => {
  const axes = groups.reduce(splitGroup, skeleton.axes);
  return { axes: axes === skeleton.axes ? axes : renumbered(axes) };
};

const splitGroup = (axes: Axe[], group: ThemeGroup): Axe[] => {
  const axeOf = (theme: string) =>
    axes.find((axe) => wordsKey(axe.titre) === wordsKey(theme));
  if (group.variants.every(({ theme }) => axeOf(theme))) {
    return axes;
  }
  const anchor =
    axes.find((axe) => wordsKey(axe.titre) === wordsKey(group.label)) ??
    axes.find((axe) => titlesMatch(axe.titre, group.label)) ??
    axes.find((axe) => titleIncludes(group.label, axe.titre));
  if (!anchor) {
    return axes;
  }
  const block = group.variants.map(
    ({ theme }): Axe =>
      axeOf(theme) ?? { numero: anchor.numero, titre: theme, sousAxes: [] }
  );
  const replaced = new Set<Axe>([anchor, ...block]);
  return axes.flatMap((axe) =>
    axe === anchor ? block : replaced.has(axe) ? [] : [axe]
  );
};

/** Des axes que le modèle a numérotés 1, 2, 3… le restent, sous-axes compris. */
const renumbered = (axes: Axe[]): Axe[] =>
  axes.every(({ numero }) => /^\d+$/u.test(numero.trim()))
    ? axes.map((axe, index) => {
        const numero = String(index + 1);
        const prefix = `${axe.numero.trim()}.`;
        return {
          ...axe,
          numero,
          sousAxes: axe.sousAxes.map((sousAxe) => ({
            ...sousAxe,
            numero: sousAxe.numero.startsWith(prefix)
              ? `${numero}.${sousAxe.numero.slice(prefix.length)}`
              : sousAxe.numero,
          })),
        };
      })
    : axes;
