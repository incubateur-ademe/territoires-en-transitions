import type { EmtWorksheet } from './import-emt-indicateurs.service.ts';
import { InvalidEmtImportError } from './import-emt-indicateurs.error.ts';

type WorksheetCell = Readonly<{ v?: unknown }>;
type Worksheet = Readonly<Record<string, WorksheetCell | undefined>>;

type Workbook = Readonly<{
  SheetNames: readonly string[];
  Sheets: Readonly<Record<string, Worksheet | undefined>>;
}>;

type SheetJsPort = Readonly<{
  read: (data: ArrayBuffer, options: Readonly<{ type: 'array' }>) => Workbook;
  utils: Readonly<{
    decode_cell: (address: string) => Readonly<{ r: number; c: number }>;
    encode_cell: (coordinates: Readonly<{ r: number; c: number }>) => string;
  }>;
}>;

export type DecodeEmtWorksheet = (file: File) => Promise<EmtWorksheet>;

/** Adapts the first SheetJS worksheet to the narrow import-use-case port. */
export const createEmtWorksheetDecoder =
  (sheetJs: SheetJsPort): DecodeEmtWorksheet =>
  async (file) => {
    const workbook = sheetJs.read(await file.arrayBuffer(), { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = firstSheetName ? workbook.Sheets[firstSheetName] : undefined;
    if (!sheet) {
      throw new InvalidEmtImportError(
        'Le classeur EMT ne contient aucune feuille'
      );
    }

    let lastDataRow = 0;
    let headerRow: number | null = null;
    for (const [cellAddress, cell] of Object.entries(sheet)) {
      if (cellAddress.startsWith('!') || !cell) {
        continue;
      }
      const cellCoordinates = sheetJs.utils.decode_cell(cellAddress);
      if (cellCoordinates.r > 0) {
        if (cell.v === 'N°') {
          headerRow = cellCoordinates.r;
        }
        lastDataRow = Math.max(lastDataRow, cellCoordinates.r);
      }
    }
    if (headerRow === null) {
      throw new InvalidEmtImportError("L'en-tête EMT « N° » est introuvable");
    }

    return {
      firstDataRow: headerRow + 1,
      lastDataRowExclusive: lastDataRow + 1,
      getCellValue: (row, column) => {
        const address = sheetJs.utils.encode_cell({ r: row, c: column });
        return sheet[address]?.v ?? null;
      },
    };
  };
