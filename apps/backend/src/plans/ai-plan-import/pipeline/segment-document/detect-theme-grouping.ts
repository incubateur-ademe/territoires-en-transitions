import { stripTitleNumber } from '../../adapters/normalize-plan-labels';
import type {
  ThemeGroup,
  ThemeGroupingDoubt,
} from '../../models/import-question';
import type { DocumentUnit } from './document-unit';

// « 1 Bâtiments », « IV. Mobilité », « Axe 2 » : un thème numéroté est un axe
// que le document a déjà tranché, ses variantes de graphie aussi.
const NUMBERED_THEME = /^\s*(?:axe\s*)?(?:\d{1,2}|[IVX]{1,4})(?!\p{L})/iu;
const STOP_WORDS = new Set(
  'LE LA LES L DE DES DU D ET EN A AU AUX POUR SUR PAR UN UNE'.split(' ')
);
// « DECHETS ASSIMILES - … » et « DECHETS ASSIMILES PRIS EN CHARGE … » : deux
// mots porteurs en commun ; « BRIQUE – » et « BRIQUE : » n'en ont qu'un.
const MIN_SHARED_WORDS = 2;
// Une ligne de synthèse est un libellé, pas un paragraphe.
const MAX_LABEL_LENGTH = 150;
// Les premiers mots du titre d'une fiche, cités par la synthèse.
const FICHE_KEY_WORDS = 5;
const MIN_FICHE_KEY_WORDS = 3;

const wordsOf = (text: string): string[] =>
  text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
    .match(/[\p{L}\p{N}]+/gu) ?? [];

const startsWith = (words: string[], head: string[]): boolean =>
  head.length > 0 && head.every((word, index) => words[index] === word);

/**
 * La tête commune de deux thèmes : celle qui précède la parenthèse
 * (« BIODECHETS (végétaux) »), ou au moins deux mots porteurs en tête.
 */
const sharedHead = (a: string, b: string): string[] | null => {
  const [headA, headB] = [a, b].map((theme) => wordsOf(theme.split('(')[0]));
  if (
    headA.length > 0 &&
    headA.join(' ') === headB.join(' ') &&
    (a.includes('(') || b.includes('('))
  ) {
    return headA;
  }
  const [wordsA, wordsB] = [wordsOf(a), wordsOf(b)];
  const shorter = Math.min(wordsA.length, wordsB.length);
  let shared = 0;
  while (shared < shorter && wordsA[shared] === wordsB[shared]) shared++;
  const head = wordsA.slice(0, shared);
  return shared < shorter &&
    head.filter((word) => !STOP_WORDS.has(word)).length >= MIN_SHARED_WORDS
    ? head
    : null;
};

type Theme = { theme: string; fiches: DocumentUnit[] };

/**
 * Les fiches rangées sous des thèmes proches (« BIODECHETS (végétaux) »,
 * « BIODECHETS (restes alimentaires) ») qu'une page hors des fiches réunit
 * sous un seul libellé. La preuve est exigée : cette page cite la tête des
 * thèmes moins de fois qu'ils ne sont, et des fiches d'au moins deux d'entre
 * eux. Un sommaire qui liste chaque thème ne prouve rien.
 */
export const detectThemeGroupingDoubt = (
  units: DocumentUnit[]
): ThemeGroupingDoubt | null => {
  const fiches = units.filter(
    (unit) => unit.kind === 'fiche' && !unit.continued && unit.headingPath[0]
  );
  const themes = new Map<string, Theme>();
  for (const fiche of fiches) {
    const theme = fiche.headingPath[0];
    const known = themes.get(theme) ?? { theme, fiches: [] };
    themes.set(theme, { ...known, fiches: [...known.fiches, fiche] });
  }
  const unnumbered = [...themes.keys()].filter(
    (theme) => !NUMBERED_THEME.test(theme)
  );
  const candidates = new Map<string, { head: string[]; themes: Set<string> }>();
  unnumbered.forEach((a, index) =>
    unnumbered.slice(index + 1).forEach((b) => {
      const head = sharedHead(a, b);
      if (!head) return;
      const key = head.join(' ');
      const candidate = candidates.get(key) ?? { head, themes: new Set() };
      candidates.set(key, {
        head,
        themes: candidate.themes.add(a).add(b),
      });
    })
  );

  const outside = units
    .filter((unit) => unit.kind !== 'fiche')
    .flatMap((unit) => unit.lines);
  const taken = new Set<string>();
  const groups: ThemeGroup[] = [];
  for (const { head, themes: names } of candidates.values()) {
    const variants = [...names].map((name) => themes.get(name) as Theme);
    const evidence = findEvidence(head, variants, outside);
    if (!evidence || variants.some(({ theme }) => taken.has(theme))) {
      continue;
    }
    variants.forEach(({ theme }) => taken.add(theme));
    groups.push({
      label: evidence.text.trim(),
      labelPage: evidence.pageIndex + 1,
      variants: variants
        .sort((a, b) => firstPage(a) - firstPage(b))
        .map((variant) => ({
          theme: variant.theme,
          fiches: variant.fiches.length,
          exampleTitle: variant.fiches[0].title ?? variant.theme,
          page: firstPage(variant) + 1,
        })),
    });
  }
  return groups.length > 0
    ? {
        kind: 'theme-grouping',
        groups: groups.sort((a, b) => a.variants[0].page - b.variants[0].page),
        proposed: 'grouped',
      }
    : null;
};

const firstPage = ({ fiches }: Theme): number => fiches[0].pageStart;

/** La ligne de synthèse qui réunit les variantes, sur une page qui en cite les fiches. */
const findEvidence = (
  head: string[],
  variants: Theme[],
  outside: DocumentUnit['lines']
): DocumentUnit['lines'][number] | null => {
  const headLines = outside.filter(
    (line) =>
      line.text.trim().length <= MAX_LABEL_LENGTH &&
      startsWith(wordsOf(line.text), head)
  );
  const pages = [...new Set(headLines.map(({ pageIndex }) => pageIndex))];
  const page = pages.find((pageIndex) => {
    const onPage = headLines.filter((line) => line.pageIndex === pageIndex);
    const pageText = outside
      .filter((line) => line.pageIndex === pageIndex)
      .map((line) => ` ${wordsOf(line.text).join(' ')} `);
    const citesFicheOf = (variant: Theme) =>
      variant.fiches.some((fiche) => {
        const key = ficheKeyOf(fiche);
        return key !== null && pageText.some((line) => line.includes(key));
      });
    return (
      onPage.length < variants.length &&
      variants.filter(citesFicheOf).length >= 2
    );
  });
  return headLines.find((line) => line.pageIndex === page) ?? null;
};

const ficheKeyOf = (fiche: DocumentUnit): string | null => {
  const words = wordsOf(
    stripTitleNumber(fiche.title ?? '').replace(/^[\d.\s]+/u, '')
  ).slice(0, FICHE_KEY_WORDS);
  return words.length >= MIN_FICHE_KEY_WORDS ? ` ${words.join(' ')} ` : null;
};
