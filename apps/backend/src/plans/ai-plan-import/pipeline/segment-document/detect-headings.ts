import { DocumentPage, PageLine } from '../document/document-page';
import {
  HEADING_CONFIDENCE_THRESHOLD,
  HeadingMatch,
  matchHeading,
} from './heading-patterns';

export type DetectedHeading = {
  pageIndex: number;
  lineIndex: number;
  match: HeadingMatch;
};

// Un titre est « grand » à partir de 15 % au-dessus de la taille du corps.
const LARGE_FONT_RATIO = 1.15;
// En dessous de 80 % du corps : logos, mentions, légendes, jamais des titres.
const SMALL_FONT_RATIO = 0.8;
const SAME_FONT_TOLERANCE = 0.5;
// Un titre en grande police court souvent sur deux ou trois lignes.
const MAX_CONTINUATION_LINES = 2;
const MAX_JOINED_LENGTH = 120;
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
      const continuation = isLarge ? continuationOf(page.lines, lineIndex) : [];
      const joined =
        continuation.length > 0
          ? accepted(
              matchHeading(
                [line, ...continuation].map((l) => l.text.trim()).join(' '),
                { isLarge }
              )
            )
          : null;
      const match = joined ?? accepted(matchHeading(line.text, { isLarge }));
      if (!match) {
        return;
      }
      if (joined) {
        skipUntil = lineIndex + continuation.length;
      }
      headings.push({ pageIndex: page.index, lineIndex, match });
    });
    return headings;
  });

  return attachNumberPrefixes(
    keepNumberSequence(detected),
    pages,
    (line) => sizeOf(line) === 'large'
  );
};

const accepted = (match: HeadingMatch | null): HeadingMatch | null =>
  match && match.confidence >= HEADING_CONFIDENCE_THRESHOLD ? match : null;

/** Les lignes suivantes de même grande police, sans rien de minuscule : la suite du titre. */
const continuationOf = (lines: PageLine[], lineIndex: number): PageLine[] => {
  const first = lines[lineIndex];
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
    if (
      first.fontSize === undefined ||
      line.fontSize === undefined ||
      Math.abs(line.fontSize - first.fontSize) > SAME_FONT_TOLERANCE ||
      length > MAX_JOINED_LENGTH ||
      !hasNoLowercase(text) ||
      // « II. » ou « 3 » : le début du titre suivant, pas la suite de celui-ci.
      /^(?:[IVX]{1,4}|\d{1,2})[.)]?(?:\s|$)/u.test(text)
    ) {
      break;
    }
    continuation.push(line);
  }
  return continuation;
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
