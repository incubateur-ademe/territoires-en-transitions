import { z } from 'zod';

// Expected CSV headers
const HEADERS = {
  communeCode: 'Code Insee Commune',
  communeName: 'Nom Commune',
  departementCode: 'Département Commune',
  syndicatSiren: 'Siren Groupement',
  syndicatName: 'Nom Groupement',
  syndicatNature: 'Nature Juridique Groupement',
  epciSiren: 'Siren Groupement intermédiaire',
  epciName: 'Nom Groupement intermédiaire',
  epciNature: 'Nature Juridique Groupement intermédiaire',
} as const;

type ColumnIndices = Record<keyof typeof HEADERS, number>;

const parsedRowSchema = z.object({
  communeCode: z.string().min(1),
  communeName: z.string(),
  departementCode: z.string(),
  syndicatSiren: z.string(),
  syndicatName: z.string(),
  epciSiren: z.string(),
  epciName: z.string(),
});

export type ParsedRow = z.infer<typeof parsedRowSchema>;
export type SyndicatInfo = { name: string; communeCount: number };
export type TransfertInfo = {
  epciSiren: string;
  epciName: string;
  syndicats: Map<string, SyndicatInfo>;
};

const buildColumnIndices = (headerRow: string[]): ColumnIndices => {
  const findIndex = (headerName: string): number => {
    const index = headerRow.findIndex(
      (h) => h.trim().toLowerCase() === headerName.toLowerCase()
    );
    if (index === -1) throw new Error(`Header not found: "${headerName}"`);
    return index;
  };

  return {
    communeCode: findIndex(HEADERS.communeCode),
    communeName: findIndex(HEADERS.communeName),
    departementCode: findIndex(HEADERS.departementCode),
    syndicatSiren: findIndex(HEADERS.syndicatSiren),
    syndicatName: findIndex(HEADERS.syndicatName),
    syndicatNature: findIndex(HEADERS.syndicatNature),
    epciSiren: findIndex(HEADERS.epciSiren),
    epciName: findIndex(HEADERS.epciName),
    epciNature: findIndex(HEADERS.epciNature),
  };
};

const getCell = (row: string[], index: number): string =>
  (row[index] ?? '').trim();

const hasTransfertData = (row: string[], indices: ColumnIndices): boolean => {
  const epciSiren = getCell(row, indices.epciSiren);
  const epciName = getCell(row, indices.epciName);
  return epciSiren.length > 0 && epciName.length > 0;
};

const parseRow = (row: string[], indices: ColumnIndices): ParsedRow =>
  parsedRowSchema.parse({
    communeCode: getCell(row, indices.communeCode),
    communeName: getCell(row, indices.communeName),
    departementCode: getCell(row, indices.departementCode),
    syndicatSiren: getCell(row, indices.syndicatSiren),
    syndicatName: getCell(row, indices.syndicatName),
    epciSiren: getCell(row, indices.epciSiren),
    epciName: getCell(row, indices.epciName),
  });

export const parseAllRows = (rawRows: string[][]): ParsedRow[] => {
  const [headerRow, ...dataRows] = rawRows;
  if (!headerRow) return [];

  const indices = buildColumnIndices(headerRow);

  return dataRows
    .filter((row) => hasTransfertData(row, indices))
    .map((row) => {
      try {
        return parseRow(row, indices);
      } catch {
        return null;
      }
    })
    .filter((row): row is ParsedRow => row !== null);
};

export const groupByEpci = (rows: ParsedRow[]): Map<string, TransfertInfo> =>
  rows.reduce((acc, row) => {
    const existing = acc.get(row.epciSiren) ?? {
      epciSiren: row.epciSiren,
      epciName: row.epciName,
      syndicats: new Map<string, SyndicatInfo>(),
    };

    const syndicatInfo = existing.syndicats.get(row.syndicatSiren) ?? {
      name: row.syndicatName,
      communeCount: 0,
    };

    existing.syndicats.set(row.syndicatSiren, {
      ...syndicatInfo,
      communeCount: syndicatInfo.communeCount + 1,
    });

    return acc.set(row.epciSiren, existing);
  }, new Map<string, TransfertInfo>());

export const formatNatureTransfert = (info: TransfertInfo): string =>
  Array.from(info.syndicats.entries())
    .map(
      ([, syndicat]) =>
        `${syndicat.name} (${syndicat.communeCount} commune${
          syndicat.communeCount > 1 ? 's' : ''
        })`
    )
    .join(', ');
