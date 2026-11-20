import type { SheetGrid } from '../analyze-workbook/sheet-grid';
import {
  DocumentPage,
  isTabularKind,
  ReadDocument,
} from '../document/document-page';
import { cutTabularUnits } from './cut-tabular-units';
import { cutUnits, CutUnitsOptions } from './cut-units';
import type { ActionLevelDoubt } from '../../models/import-question';
import {
  detectActionLevelDoubt,
  detectHeadings,
  DetectHeadingsOptions,
} from './detect-headings';
import { DocumentUnit, numberUnits } from './document-unit';

export type SegmentDocumentOptions = CutUnitsOptions & DetectHeadingsOptions;

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
  const units = isTabularKind(document.kind)
    ? pages.flatMap((page) =>
        cutTabularUnits(page, options.maxTokens, gridOfPage(document, page))
      )
    : cutUnits(
        pages,
        detectHeadings(pages, { actionLevel: options.actionLevel }),
        options
      );
  return numberUnits(units);
};

/** Un tableur se lit par rangées : la question des titres ne s'y pose pas. */
export const detectDocumentActionLevelDoubt = (
  document: ReadDocument
): ActionLevelDoubt | null =>
  isTabularKind(document.kind)
    ? null
    : detectActionLevelDoubt(
        document.pages.filter((page) => page.source !== 'empty')
      );

/** La grille d'une page de tableur, dans le même ordre que les pages. */
const gridOfPage = (
  document: ReadDocument,
  page: DocumentPage
): SheetGrid | undefined => {
  const grid = document.workbook?.[page.index];
  return grid && grid.name === (page.label ?? '') ? grid : undefined;
};
