export type CrosswalkRow = { code2021: number; code2025: number | null };
export type MappingType = 'one_to_one' | 'split' | 'no_equivalent';

const CODE_RE = /^C(\d{4})$/;

const parseCode = (raw: string): number | null => {
  const m = raw.trim().match(CODE_RE);
  return m ? parseInt(m[1], 10) : null;
};

type RawCodes = {
  oldCode: number | null;
  hasArrow: boolean;
  newCode: number | null;
};

const extractCodes = (row: string[]): RawCodes => ({
  oldCode: parseCode(row[1] ?? ''),
  hasArrow: (row[3] ?? '').trim() === '--->',
  newCode: parseCode(row[4] ?? ''),
});

type Acc = { currentOldCode: number | null; rows: CrosswalkRow[] };

/**
 * Parse the crosswalk CSV into (code2021, code2025) pairs.
 *
 * Tracks a "current old code" via reduce to handle split mappings
 * where continuation rows carry `--->` but no old code.
 * Rows without old code AND without arrow are new-only codes → skipped.
 */
export const parseCrosswalkRows = (rawRows: string[][]): CrosswalkRow[] =>
  rawRows
    .slice(1)
    .map(extractCodes)
    .reduce<Acc>(
      ({ currentOldCode, rows }, { oldCode, hasArrow, newCode }) => {
        if (oldCode !== null) {
          return {
            currentOldCode: oldCode,
            rows: [...rows, { code2021: oldCode, code2025: newCode }],
          };
        }
        if (hasArrow && newCode !== null && currentOldCode !== null) {
          return {
            currentOldCode,
            rows: [...rows, { code2021: currentOldCode, code2025: newCode }],
          };
        }
        return { currentOldCode, rows };
      },
      { currentOldCode: null, rows: [] }
    ).rows;

export const determineMappingTypes = (
  rows: CrosswalkRow[]
): Map<number, MappingType> => {
  const newCodeCounts = rows.reduce(
    (acc, { code2021, code2025 }) =>
      code2025 !== null
        ? acc.set(code2021, (acc.get(code2021) ?? 0) + 1)
        : acc,
    new Map<number, number>()
  );

  return rows.reduce((acc, { code2021 }) => {
    if (acc.has(code2021)) return acc;
    const count = newCodeCounts.get(code2021) ?? 0;
    const type: MappingType =
      count === 0 ? 'no_equivalent' : count > 1 ? 'split' : 'one_to_one';
    return acc.set(code2021, type);
  }, new Map<number, MappingType>());
};
