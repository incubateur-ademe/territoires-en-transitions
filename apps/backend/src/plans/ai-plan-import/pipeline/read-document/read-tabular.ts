import { Result, success } from '@tet/backend/utils/result.type';
import { readCsvGrid } from '../analyze-workbook/read-csv-grid';
import {
  ReadWorkbookError,
  readWorkbookGrids,
} from '../analyze-workbook/read-workbook-grid';
import { renderGridLines, SheetGrid } from '../analyze-workbook/sheet-grid';
import { buildPage, DocumentPage } from '../document/document-page';

export type ReadTabularError = ReadWorkbookError;

export type ReadTabular = { pages: DocumentPage[]; workbook: SheetGrid[] };

/** Une page par onglet, une ligne par rangée, cellules séparées par une tabulation. */
export const readXlsxPages = async (
  buffer: Buffer
): Promise<Result<ReadTabular, ReadTabularError>> => {
  const grids = await readWorkbookGrids(buffer);
  if (!grids.success) {
    return grids;
  }
  return success(toTabular(grids.data));
};

/** Le CSV tient sur une seule page, sans nom d'onglet. */
export const readCsvPages = (buffer: Buffer): ReadTabular =>
  toTabular([readCsvGrid(buffer)]);

/** La page d'un onglet : une ligne par rangée, à la position de l'onglet. */
export const buildSheetPage = (grid: SheetGrid, index: number): DocumentPage =>
  buildPage(
    index,
    renderGridLines(grid).map(({ text }) => ({ text })),
    grid.name ? { label: grid.name } : {}
  );

const toTabular = (workbook: SheetGrid[]): ReadTabular => ({
  pages: workbook.map(buildSheetPage),
  workbook,
});
