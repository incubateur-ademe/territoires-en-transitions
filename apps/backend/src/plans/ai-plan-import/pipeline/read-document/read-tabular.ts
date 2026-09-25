import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TimeoutError, withTimeout } from 'es-toolkit';
import ExcelJS from 'exceljs';
import { buildPage, DocumentPage } from '../document/document-page';

const EXCEL_TIMEOUT_MS = 30_000;

export type ReadTabularError = { kind: 'parse_failed' } | { kind: 'timeout' };

/** Une page par feuille, une ligne par rangée, cellules séparées par une tabulation. */
export const readXlsxPages = async (
  buffer: Buffer
): Promise<Result<DocumentPage[], ReadTabularError>> => {
  try {
    const workbook = new ExcelJS.Workbook();
    await withTimeout(
      () => workbook.xlsx.load(buffer as unknown as ArrayBuffer),
      EXCEL_TIMEOUT_MS
    );
    return success(
      workbook.worksheets
        .map((worksheet) => worksheetToLines(worksheet))
        .filter((sheet) => sheet.lines.length > 0)
        .map((sheet, index) =>
          buildPage(
            index,
            sheet.lines.map((text) => ({ text })),
            { label: sheet.name }
          )
        )
    );
  } catch (error) {
    if (error instanceof TimeoutError) {
      return failure({ kind: 'timeout' });
    }
    return failure({ kind: 'parse_failed' });
  }
};

/** Le CSV tient sur une seule page, tel quel. */
export const readCsvPages = (buffer: Buffer): DocumentPage[] => [
  buildPage(
    0,
    buffer
      .toString('utf-8')
      .split('\n')
      .map((text) => ({ text: text.trimEnd() }))
  ),
];

const worksheetToLines = (
  worksheet: ExcelJS.Worksheet
): { name: string; lines: string[] } => ({
  name: worksheet.name,
  lines: worksheet
    .getSheetValues()
    .map((row) =>
      Array.isArray(row)
        ? row.slice(1).map(cellToString).join('\t').trimEnd()
        : ''
    )
    .filter((line) => line.trim().length > 0),
});

const cellToString = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'object') {
    if ('text' in value && typeof value.text === 'string') {
      return value.text;
    }
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => cellToString(part)).join('');
    }
    if ('error' in value && typeof value.error === 'string') {
      return value.error;
    }
    if ('result' in value) {
      return cellToString(value.result);
    }
    return '';
  }
  return String(value);
};
