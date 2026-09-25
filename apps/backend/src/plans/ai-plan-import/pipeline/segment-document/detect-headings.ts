import { DocumentPage } from '../document/document-page';
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

export const detectHeadings = (pages: DocumentPage[]): DetectedHeading[] => {
  const bodyFontSize = estimateBodyFontSize(pages);
  return pages.flatMap((page) =>
    page.lines.flatMap((line, lineIndex) => {
      const isLarge =
        bodyFontSize !== null &&
        line.fontSize !== undefined &&
        line.fontSize >= bodyFontSize * LARGE_FONT_RATIO;
      const match = matchHeading(line.text, { isLarge });
      return match && match.confidence >= HEADING_CONFIDENCE_THRESHOLD
        ? [{ pageIndex: page.index, lineIndex, match }]
        : [];
    })
  );
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
