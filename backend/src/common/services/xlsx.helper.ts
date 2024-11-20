import { Worksheet } from 'exceljs';

// styles de fonte
export const BOLD = { bold: true };

// ajuste la largeur des colonnes à leur contenu
// Ref: https://stackoverflow.com/a/69287841
export const adjustColumnWidth = (worksheet: Worksheet) => {
  worksheet.columns.forEach((column) => {
    const lengths = column.values?.map((v) => v?.toString().length);
    if (lengths) {
      const maxLength = Math.max(
        ...lengths.filter((v) => typeof v === 'number')
      );
      column.width = maxLength + 2;
    }
  });
};

// normalise le nom des feuilles qui ne doivent pas contenir certains caractères
const RE_WS_FORBIDDEN_CHARS = /[*?:\\/[\]]/g;
export const normalizeWorksheetName = (name: string) => name.replaceAll(RE_WS_FORBIDDEN_CHARS, '-');
