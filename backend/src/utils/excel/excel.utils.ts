import { format } from 'date-fns';
import { Worksheet } from 'exceljs';

// styles de fonte
export const BOLD = { bold: true };

// formatage d'une cellule contenant un montant en euros
export const NUM_FORMAT_EURO = '#,##0.00 [$€-1]';

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
export const normalizeWorksheetName = (name: string) =>
  name.replaceAll(RE_WS_FORBIDDEN_CHARS, '-');

export const joinNames = (
  items: Array<{ nom: string }> | null | undefined,
  separator = ', '
) => {
  return items?.map(({ nom }) => nom).join(separator) ?? '';
};

export const formatDate = (dateStr: string | null | undefined) => {
  return dateStr ? format(new Date(dateStr), 'dd/MM/yyyy') : '';
};
