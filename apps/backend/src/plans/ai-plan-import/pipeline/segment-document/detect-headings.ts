import { DocumentPage, PageLine } from '../document/document-page';
import {
  FICHE_LEVEL,
  HEADING_CONFIDENCE_THRESHOLD,
  HeadingMatch,
  matchHeading,
  SECTION_LEVEL,
} from './heading-patterns';

export type DetectedHeading = {
  pageIndex: number;
  lineIndex: number;
  /** Dernière ligne du titre, qui peut courir sur plusieurs lignes. */
  lastLineIndex: number;
  isLarge: boolean;
  match: HeadingMatch;
};

// Un titre est « grand » à partir de 15 % au-dessus de la taille du corps.
const LARGE_FONT_RATIO = 1.15;
// En dessous de 80 % du corps : logos, mentions, légendes, jamais des titres.
const SMALL_FONT_RATIO = 0.8;
const SAME_FONT_TOLERANCE = 0.5;
// Un titre en grande police court souvent sur plusieurs lignes, jusqu'à un mot
// par ligne sur une page de garde d'axe.
const MAX_CONTINUATION_LINES = 4;
const MAX_JOINED_LENGTH = 120;
// « ACTION 2 - ACCOMPAGNER LES PROJETS … » ou « OBJECTIF 2 - … » annonce son
// niveau sans ambiguïté : sa suite peut être plus longue, et d'une autre
// grande police.
const MAX_JOINED_EXPLICIT_LENGTH = 200;
// Une page qui aligne des lignes « 2.1.3 Titre » presque sans texte entre
// elles est un tableau récapitulatif : ce sont des lignes de tableau, pas des
// fiches.
const SUMMARY_MIN_ROWS = 4;
const SUMMARY_MAX_LINES_PER_ROW = 4;
// Les numéros de fiches se suivent : un saut plus grand trahit un numéro de
// page ou un chiffre clé en grand.
const MAX_NUMBER_GAP = 3;
const MAX_PREFIX_LINES = 2;
const MAX_PREFIX_LENGTH = 80;

export const detectHeadings = (pages: DocumentPage[]): DetectedHeading[] => {
  const bodyFontSize = estimateBodyFontSize(pages);
  const sizeOf = (line: PageLine) =>
    bodyFontSize === null || line.fontSize === undefined
      ? 'body'
      : line.fontSize >= bodyFontSize * LARGE_FONT_RATIO
      ? 'large'
      : line.fontSize < bodyFontSize * SMALL_FONT_RATIO
      ? 'small'
      : 'body';

  const detected = pages.flatMap((page) => {
    const headings: DetectedHeading[] = [];
    let skipUntil = -1;
    page.lines.forEach((line, lineIndex) => {
      const size = sizeOf(line);
      if (lineIndex <= skipUntil || size === 'small') {
        return;
      }
      const isLarge = size === 'large';
      const alone = accepted(matchHeading(line.text, { isLarge }));
      const explicit =
        alone !== null &&
        (isExplicit(alone, 'fiche') ||
          isExplicit(alone, 'orientation') ||
          isExplicit(alone, 'axe'));
      const continuation = isLarge
        ? continuationOf(page.lines, lineIndex, {
            explicit,
            isLargeLine: (other) => sizeOf(other) === 'large',
          })
        : [];
      const continuationText = continuation.map((l) => l.text.trim()).join(' ');
      const joined =
        continuation.length === 0
          ? null
          : explicit && alone
          ? { ...alone, title: `${alone.title} ${continuationText}`.trim() }
          : accepted(
              matchHeading(`${line.text.trim()} ${continuationText}`, {
                isLarge,
              })
            );
      const match = joined ?? alone;
      if (!match) {
        return;
      }
      const lastLineIndex = joined
        ? lineIndex + continuation.length
        : lineIndex;
      skipUntil = lastLineIndex;
      headings.push({
        pageIndex: page.index,
        lineIndex,
        lastLineIndex,
        isLarge,
        match,
      });
    });
    return headings;
  });

  return attachNumberPrefixes(
    keepNumberSequence(
      dropIntertitleSections(
        demoteCapitalsBelowExplicitAxes(
          dropSummaryRows(demoteBannersAboveFiches(detected), pages)
        )
      )
    ),
    pages,
    (line) => sizeOf(line) === 'large'
  );
};

const isExplicit = (match: HeadingMatch, kind: HeadingMatch['kind']) =>
  match.kind === kind && match.confidence === 1;

/**
 * « 1- AMELIORER LA PERFORMANCE DES BATIMENTS » répété en haut de chaque
 * fiche, juste au-dessus de « ACTION 2 - … » : c'est l'objectif qui regroupe
 * les fiches, pas une fiche.
 */
const demoteBannersAboveFiches = (
  headings: DetectedHeading[]
): DetectedHeading[] =>
  headings.map((heading, index) => {
    const next = headings[index + 1];
    const isBanner =
      heading.match.level >= FICHE_LEVEL &&
      !isExplicit(heading.match, 'fiche') &&
      next !== undefined &&
      next.pageIndex === heading.pageIndex &&
      next.lineIndex === heading.lastLineIndex + 1 &&
      isExplicit(next.match, 'fiche');
    return isBanner
      ? {
          ...heading,
          match: { ...heading.match, kind: 'orientation', level: 2 },
        }
      : heading;
  });

/** Les lignes numérotées d'un tableau récapitulatif ne sont pas des titres. */
const dropSummaryRows = (
  headings: DetectedHeading[],
  pages: DocumentPage[]
): DetectedHeading[] => {
  const isNumberedRow = (heading: DetectedHeading) =>
    heading.match.kind === 'fiche' && !isExplicit(heading.match, 'fiche');
  const lineCountByPage = new Map(
    pages.map((page) => [page.index, page.lines.length])
  );
  const rowCountByPage = new Map<number, number>();
  headings.filter(isNumberedRow).forEach((row) => {
    rowCountByPage.set(
      row.pageIndex,
      (rowCountByPage.get(row.pageIndex) ?? 0) + 1
    );
  });
  const isSummaryPage = (pageIndex: number) => {
    const rows = rowCountByPage.get(pageIndex) ?? 0;
    return (
      rows >= SUMMARY_MIN_ROWS &&
      (lineCountByPage.get(pageIndex) ?? 0) <= rows * SUMMARY_MAX_LINES_PER_ROW
    );
  };
  return headings.filter(
    (heading) => !(isNumberedRow(heading) && isSummaryPage(heading.pageIndex))
  );
};

/**
 * Un document qui nomme ses axes (« AXE STRATEGIQUE 4 ») ne fait pas d'une
 * ligne en majuscules un axe : c'est un intertitre ou la fin d'un titre
 * coupée par la mise en page (« ENERGETIQUE DES BATIMENTS TERTIAIRES »).
 * Seule une ligne qui se dit axe (« AXE TRANSVERSAL ») le reste.
 */
const demoteCapitalsBelowExplicitAxes = (
  headings: DetectedHeading[]
): DetectedHeading[] => {
  const namesItsAxes = headings.some((heading) =>
    isExplicit(heading.match, 'axe')
  );
  return namesItsAxes
    ? headings.map((heading) =>
        heading.match.kind === 'majuscules' &&
        heading.match.level < 2 &&
        !/^axe\b/iu.test(heading.match.title)
          ? { ...heading, match: { ...heading.match, level: 2 } }
          : heading
      )
    : headings;
};

/**
 * « Suivi et évaluation » en corps de texte, juste après le titre d'une
 * fiche : un intertitre de la fiche, pas une partie du document.
 */
const dropIntertitleSections = (
  headings: DetectedHeading[]
): DetectedHeading[] =>
  headings.filter((heading, index) => {
    const previous = headings[index - 1];
    return !(
      heading.match.level === SECTION_LEVEL &&
      !heading.isLarge &&
      previous !== undefined &&
      previous.match.level >= FICHE_LEVEL &&
      heading.pageIndex - previous.pageIndex <= 1
    );
  });

const accepted = (match: HeadingMatch | null): HeadingMatch | null =>
  match && match.confidence >= HEADING_CONFIDENCE_THRESHOLD ? match : null;

/**
 * Les lignes suivantes de même grande police, sans rien de minuscule : la
 * suite du titre. Un titre explicite (fiche, objectif, axe) admet une suite
 * plus longue, dans une autre police tant qu'elle reste grande.
 */
const continuationOf = (
  lines: PageLine[],
  lineIndex: number,
  {
    explicit,
    isLargeLine,
  }: { explicit: boolean; isLargeLine: (line: PageLine) => boolean }
): PageLine[] => {
  const first = lines[lineIndex];
  const maxLength = explicit ? MAX_JOINED_EXPLICIT_LENGTH : MAX_JOINED_LENGTH;
  const continuation: PageLine[] = [];
  let length = first.text.trim().length;
  for (
    let index = lineIndex + 1;
    index < lines.length && continuation.length < MAX_CONTINUATION_LINES;
    index++
  ) {
    const line = lines[index];
    const text = line.text.trim();
    length += text.length + 1;
    const sameFont =
      first.fontSize !== undefined &&
      line.fontSize !== undefined &&
      (Math.abs(line.fontSize - first.fontSize) <= SAME_FONT_TOLERANCE ||
        (explicit && isLargeLine(line)));
    if (
      !sameFont ||
      length > maxLength ||
      !hasNoLowercase(text) ||
      // « II. » ou « 3 » : le début du titre suivant, pas la suite de celui-ci.
      /^(?:[IVX]{1,4}|\d{1,2})[.)]?(?:\s|$)/u.test(text) ||
      // « ACTION 1- PILOTER » sous « 1- ASSURER LA GOUVERNANCE » : un autre titre.
      startsExplicitHeading(text)
    ) {
      break;
    }
    continuation.push(line);
  }
  return continuation;
};

const startsExplicitHeading = (text: string): boolean => {
  const match = matchHeading(text);
  return (
    match !== null &&
    match.confidence === 1 &&
    match.kind !== 'markdown' &&
    match.kind !== 'section'
  );
};

const hasNoLowercase = (text: string): boolean => {
  const letters = text.replace(/[^\p{L}]/gu, '');
  return letters.replace(/[^\p{Ll}]/gu, '').length <= letters.length * 0.2;
};

/** Écarte les numéros seuls qui ne prolongent pas la suite des précédents. */
const keepNumberSequence = (headings: DetectedHeading[]): DetectedHeading[] => {
  let last = 0;
  return headings.filter(({ match }) => {
    if (match.kind !== 'numero') {
      return true;
    }
    const number = Number(match.number);
    if (number === 1 || (number > last && number <= last + MAX_NUMBER_GAP)) {
      last = number;
      return true;
    }
    return false;
  });
};

/**
 * « ANCRER L'ADMINISTRATION » puis « 1 DANS L'ÉCO-RESPONSABILITÉ » : les
 * lignes en grande police et en majuscules juste au-dessus du numéro sont le
 * début du titre de la fiche.
 */
const attachNumberPrefixes = (
  headings: DetectedHeading[],
  pages: DocumentPage[],
  isLargeLine: (line: PageLine) => boolean
): DetectedHeading[] => {
  const pageByIndex = new Map(pages.map((page) => [page.index, page]));
  const headingAt = new Map(
    headings.map((heading) => [
      `${heading.pageIndex}:${heading.lineIndex}`,
      heading,
    ])
  );
  const absorbed = new Set<DetectedHeading>();
  const attached = headings.map((heading) => {
    const lines = pageByIndex.get(heading.pageIndex)?.lines;
    if (heading.match.kind !== 'numero' || !lines) {
      return heading;
    }
    let firstLine = heading.lineIndex;
    for (
      let index = heading.lineIndex - 1;
      index >= 0 && heading.lineIndex - index <= MAX_PREFIX_LINES;
      index--
    ) {
      const line = lines[index];
      const other = headingAt.get(`${heading.pageIndex}:${index}`);
      if (
        !isLargeLine(line) ||
        !hasNoLowercase(line.text) ||
        line.text.trim().length > MAX_PREFIX_LENGTH ||
        (other !== undefined && other.match.kind !== 'majuscules') ||
        (index < firstLine - 1 &&
          Math.abs((line.fontSize ?? 0) - (lines[firstLine].fontSize ?? 0)) >
            SAME_FONT_TOLERANCE)
      ) {
        break;
      }
      if (other) {
        absorbed.add(other);
      }
      firstLine = index;
    }
    if (firstLine === heading.lineIndex) {
      return heading;
    }
    const prefix = lines
      .slice(firstLine, heading.lineIndex)
      .map((line) => line.text.trim())
      .join(' ');
    return {
      ...heading,
      lineIndex: firstLine,
      match: { ...heading.match, title: `${prefix} ${heading.match.title}` },
    };
  });
  return attached.filter((heading) => !absorbed.has(heading));
};

/** Taille de police du corps : la médiane pondérée par la longueur des lignes. */
const estimateBodyFontSize = (pages: DocumentPage[]): number | null => {
  const weighted = pages
    .flatMap((page) => page.lines)
    .filter((line) => line.fontSize !== undefined)
    .map((line) => ({
      size: line.fontSize as number,
      weight: line.text.length,
    }))
    .sort((a, b) => a.size - b.size);
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0);
  if (total === 0) {
    return null;
  }
  let cumulated = 0;
  for (const entry of weighted) {
    cumulated += entry.weight;
    if (cumulated >= total / 2) {
      return entry.size;
    }
  }
  return null;
};
