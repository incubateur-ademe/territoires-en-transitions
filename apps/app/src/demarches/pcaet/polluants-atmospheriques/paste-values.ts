export type ValueField = 'resultat' | 'objectif';

export type TargetCell = {
  indicateurId: number;
  year: number;
  field: ValueField;
};

export type PastedValue =
  | { type: 'absolute'; value: number }
  | { type: 'relative'; percentage: number };

export type ValueEntry = {
  indicateurId: number;
  year: number;
  field: ValueField;
  value: PastedValue;
};

export type ErrorReason = 'out_of_grid' | 'not_numeric';

export type CellError = {
  row: number;
  column: number;
  rawValue: string;
  reason: ErrorReason;
};

export type PasteResult = {
  entries: ValueEntry[];
  errors: CellError[];
};

export type AbsoluteConversion = { ok: true; value: number } | { ok: false };

type Anchor = {
  row: number;
  column: number;
};

const WHITESPACE = /\s/g;

type NumberAnalysis =
  | { status: 'empty' }
  | { status: 'ok'; value: number }
  | { status: 'invalid' };

export const parseFrenchNumber = (raw: string): NumberAnalysis => {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { status: 'empty' };
  }
  const normalized = trimmed.replaceAll(',', '.').replace(WHITESPACE, '');
  const value = Number(normalized);
  if (normalized === '' || Number.isNaN(value)) {
    return { status: 'invalid' };
  }
  return { status: 'ok', value };
};

type CellAnalysis =
  | { status: 'empty' }
  | { status: 'absolute'; value: number }
  | { status: 'relative'; percentage: number }
  | { status: 'invalid' };

export const analyzePasteCell = (raw: string): CellAnalysis => {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { status: 'empty' };
  }
  if (trimmed.includes('%')) {
    const analysis = parseFrenchNumber(trimmed.replaceAll('%', ''));
    return analysis.status === 'ok'
      ? { status: 'relative', percentage: analysis.value }
      : { status: 'invalid' };
  }
  const analysis = parseFrenchNumber(trimmed);
  return analysis.status === 'ok'
    ? { status: 'absolute', value: analysis.value }
    : { status: 'invalid' };
};

export const toAbsolute = (
  value: PastedValue,
  reference: number | null
): AbsoluteConversion => {
  if (value.type === 'absolute') {
    return { ok: true, value: value.value };
  }
  if (reference === null) {
    return { ok: false };
  }
  return { ok: true, value: reference * (1 + value.percentage / 100) };
};

export const splitPaste = (paste: string): string[][] => {
  const lines = paste.replace(/\r\n?/g, '\n').split('\n');
  const usefulLines =
    lines.length > 1 && lines[lines.length - 1] === ''
      ? lines.slice(0, -1)
      : lines;
  return usefulLines.map((line) => line.split('\t'));
};

export const mapPasteToValues = ({
  paste,
  targetGrid,
  anchor,
}: {
  paste: string;
  targetGrid: ReadonlyArray<ReadonlyArray<TargetCell | null>>;
  anchor: Anchor;
}): PasteResult => {
  const blocks = splitPaste(paste);

  return blocks.reduce<PasteResult>(
    (result, cells, rowIndex) =>
      cells.reduce<PasteResult>((accumulator, rawValue, columnIndex) => {
        const analysis = analyzePasteCell(rawValue);
        if (analysis.status === 'empty') {
          return accumulator;
        }

        const row = anchor.row + rowIndex;
        const column = anchor.column + columnIndex;
        const target = targetGrid[row]?.[column] ?? null;

        if (target === null) {
          return {
            ...accumulator,
            errors: [
              ...accumulator.errors,
              { row, column, rawValue, reason: 'out_of_grid' },
            ],
          };
        }

        if (analysis.status === 'invalid') {
          return {
            ...accumulator,
            errors: [
              ...accumulator.errors,
              { row, column, rawValue, reason: 'not_numeric' },
            ],
          };
        }

        const value: PastedValue =
          analysis.status === 'relative'
            ? { type: 'relative', percentage: analysis.percentage }
            : { type: 'absolute', value: analysis.value };

        return {
          ...accumulator,
          entries: [
            ...accumulator.entries,
            {
              indicateurId: target.indicateurId,
              year: target.year,
              field: target.field,
              value,
            },
          ],
        };
      }, result),
    { entries: [], errors: [] }
  );
};
