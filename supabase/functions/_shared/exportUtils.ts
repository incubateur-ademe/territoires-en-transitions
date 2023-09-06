/**
 * Fonctions utilitaires pour les exports
 */
import {
  Cell,
  CellValue,
  Fill,
  Style,
  Worksheet,
} from 'https://esm.sh/exceljs@4.3.0';

/** Fixe le formatage numérique d'une cellule en fonction de sa valeur */
export const setCellNumFormat = (cell: Cell, numFmt?: string) => {
  cell.style = {
    ...cell.style,
    alignment: { horizontal: 'center' },
    numFmt: getNumberFormat(cell.value, numFmt),
  };
};

/** Génère le format utilisé pour les nombres */
export const FORMAT_PERCENT = 'percent';
export const getNumberFormat = (value: CellValue, numFmt?: string) => {
  const suffix = numFmt === FORMAT_PERCENT ? '%' : '';

  // pas de virgule si le nombre est entier (ou null => forcé à 0)
  if (value === null || value === undefined || Number.isInteger(value)) {
    return `0${suffix}`;
  }
  if (numFmt === FORMAT_PERCENT) {
    // un seul chiffre après la virgule pour les pourcentages
    return `0.#${suffix}`;
  }
  // deux chiffres après la virgule
  return `0.0#${suffix}`;
};

/** Génère les options pour avoir une couleur de remplissage pour une/des cellule(s) d'une feuille xlsx */
export const makeSolidFill = (color: string) =>
  ({
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: color },
  } as Fill);

/** Applique un style à plusieurs cellules */
export const setCellsStyle = (
  worksheet: Worksheet,
  /** index (base-1) de la ligne à traiter */
  rowIndex: number,
  /** index (base-1) de la colonne de début */
  colStart: number,
  /** nombre des colonnes à traiter */
  colEnd: number,
  /** styles à appliquer */
  style: Partial<Style>
) => {
  const row = worksheet.getRow(rowIndex);
  for (let c = colStart; c <= colEnd; c++) {
    const cell = row.getCell(c);
    cell.style = { ...cell.style, ...style };
  }
};

/** Génère des cellules sans valeur */
export const makeEmptyCells = (count: number) =>
  new Array(count).fill(undefined);
