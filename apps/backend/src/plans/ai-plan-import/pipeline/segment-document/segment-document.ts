import { estimateTokenCount } from '@tet/backend/utils/llm/estimate-token-count';
import { DocumentPage, ReadDocument } from '../document/document-page';
import { cutUnits, CutUnitsOptions } from './cut-units';
import { detectHeadings } from './detect-headings';
import {
  buildUnit,
  DocumentUnit,
  numberUnits,
  UnitLine,
} from './document-unit';

export type SegmentDocumentOptions = CutUnitsOptions;

// Une fiche action tient en une à trois pages : entre mille et quelques
// milliers de tokens. En dessous, on regroupe ; au-dessus, on fenêtre.
export const DEFAULT_SEGMENT_OPTIONS: SegmentDocumentOptions = {
  minTokens: 1_000,
  maxTokens: 3_500,
  overlapTokens: 200,
};

/** Le document en unités de la taille d'une fiche, numérotées dans l'ordre. */
export const segmentDocument = (
  document: ReadDocument,
  options: SegmentDocumentOptions = DEFAULT_SEGMENT_OPTIONS
): DocumentUnit[] => {
  const pages = document.pages.filter((page) => page.source !== 'empty');
  const units =
    document.kind === 'pdf'
      ? cutUnits(pages, detectHeadings(pages), options)
      : pages.flatMap((page) => cutTabularUnits(page, options.maxTokens));
  return numberUnits(units);
};

/**
 * Un tableur : chaque unité reprend l'en-tête de la feuille, et une ligne
 * du tableau n'est jamais coupée.
 */
const cutTabularUnits = (
  page: DocumentPage,
  maxTokens: number
): DocumentUnit[] => {
  const [header, ...rows] = page.lines.map(
    (line): UnitLine => ({ text: line.text, pageIndex: page.index })
  );
  if (!header) {
    return [];
  }
  const headingPath = page.label ? [page.label] : [];
  const headerTokens = estimateTokenCount(header.text) + 1;
  const units: DocumentUnit[] = [];
  let current: UnitLine[] = [];
  let tokens = headerTokens;
  for (const row of rows) {
    const rowTokens = estimateTokenCount(row.text) + 1;
    if (current.length > 0 && tokens + rowTokens > maxTokens) {
      units.push(buildUnit([header, ...current], headingPath, 'table'));
      current = [];
      tokens = headerTokens;
    }
    current.push(row);
    tokens += rowTokens;
  }
  if (current.length > 0) {
    units.push(buildUnit([header, ...current], headingPath, 'table'));
  }
  return units;
};
