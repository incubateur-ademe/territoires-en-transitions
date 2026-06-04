import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TimeoutError, withTimeout } from 'es-toolkit';
import ExcelJS from 'exceljs';
import pdf from 'pdf-parse-debugging-disabled';

const PDF_TIMEOUT_MS = 30_000;

export type ExtractionError =
  | { kind: 'unsupported_mime'; mimeType: string }
  | { kind: 'empty_text' }
  | { kind: 'parse_failed' }
  | { kind: 'timeout' };

type DocumentKind = 'pdf' | 'csv' | 'excel';

export const extractText = async (args: {
  buffer: Buffer;
  mimeType: string;
}): Promise<Result<string, ExtractionError>> => {
  const kind = classifyMimeType(args.mimeType);
  if (kind === null) {
    return failure({ kind: 'unsupported_mime', mimeType: args.mimeType });
  }

  switch (kind) {
    case 'pdf':
      return extractPdf(args.buffer);
    case 'csv':
      return extractCsv(args.buffer);
    case 'excel':
      return extractExcel(args.buffer);
  }
};

const classifyMimeType = (mimeType: string): DocumentKind | null => {
  if (mimeType === 'application/pdf') {
    return 'pdf';
  }
  if (mimeType === 'text/csv' || mimeType === 'application/csv') {
    return 'csv';
  }
  if (
    mimeType ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel'
  ) {
    return 'excel';
  }
  return null;
};

const extractPdf = async (
  buffer: Buffer
): Promise<Result<string, ExtractionError>> => {
  try {
    const parsed = await withTimeout(() => pdf(buffer), PDF_TIMEOUT_MS);
    return fromExtractedText(parsed.text);
  } catch (error) {
    if (error instanceof TimeoutError) {
      return failure({ kind: 'timeout' });
    }
    return failure({ kind: 'parse_failed' });
  }
};

const extractCsv = (buffer: Buffer): Result<string, ExtractionError> =>
  fromExtractedText(buffer.toString('utf-8'));

const extractExcel = async (
  buffer: Buffer
): Promise<Result<string, ExtractionError>> => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const text = workbook.worksheets
      .map(worksheetToText)
      .filter((sheet) => sheet.length > 0)
      .join('\n\n');
    return fromExtractedText(text);
  } catch {
    return failure({ kind: 'parse_failed' });
  }
};

const worksheetToText = (worksheet: ExcelJS.Worksheet): string =>
  worksheet
    .getSheetValues()
    .map((row) =>
      Array.isArray(row)
        ? row.slice(1).map(cellToString).join('\t').trimEnd()
        : ''
    )
    .filter((line) => line.trim().length > 0)
    .join('\n');

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

const fromExtractedText = (text: string): Result<string, ExtractionError> => {
  const trimmed = text.trim();
  if (!trimmed) {
    return failure({ kind: 'empty_text' });
  }
  return success(trimmed);
};
