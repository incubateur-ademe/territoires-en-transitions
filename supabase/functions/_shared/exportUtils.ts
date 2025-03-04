/**
 * Fonctions utilitaires pour les exports
 */
import { format, isValid } from 'https://esm.sh/date-fns@2.30.0';
import { fr } from 'https://esm.sh/date-fns@2.30.0/locale';
import Excel from 'https://esm.sh/exceljs@4.3.0';
import { TActionReferentiel, TPreuve } from './fetchActionsReferentiel.ts';
import { Enums } from './typeUtils.ts';

// Libellés des colonnes pour les tableaux scores
export const SCORE_HEADER_LABELS = [
  'Potentiel collectivité',
  'Points réalisés',
  '% réalisé',
  'Points programmés',
  '% programmé',
  'statut',
];

// bordures
export const BORDER_MEDIUM = { style: 'medium' } as Partial<Excel.Border>;

// alignements
export const ALIGN_CENTER = {
  vertical: 'middle',
  horizontal: 'center',
} as Partial<Excel.Alignment>;
export const ALIGN_LEFT_WRAP = {
  horizontal: 'left',
  wrapText: true,
} as Partial<Excel.Alignment>;
export const ALIGN_CENTER_WRAP = {
  ...ALIGN_CENTER,
  wrapText: true,
};

// styles de fonte
export const BOLD = { bold: true };
export const ITALIC = { italic: true };

/** Fixe le formatage d'une cellule contenant une date */
export const formatDate = (
  strDate: string | Date | null | undefined,
  pattern = 'dd/MM/yyyy'
) => {
  if (!strDate) {
    return null;
  }
  const d = new Date(strDate);
  return isValid(d) ? format(d, pattern, { locale: fr }) : null;
};

/** Fixe le formatage d'une cellule contenant un montant en euros */
export const setEuroValue = (
  cell: Excel.Cell,
  value: number | undefined | null
) => {
  cell.numFmt = '#,##0.00 [$€-1]';
  cell.value = value || null;
};

/** Fixe le formatage numérique d'une cellule en fonction de sa valeur */
export const setCellNumFormat = (cell: Excel.Cell, numFmt?: string) => {
  cell.style = {
    ...cell.style,
    alignment: { horizontal: 'center' },
    numFmt: getNumberFormat(cell.value, numFmt),
  };
};

/* Fixe la valeur et le formatage numérique d'une cellule */
export const setNumValue = (
  cell: Excel.Cell,
  value: number | null,
  numFmt?: string
) => {
  cell.value = value;
  setCellNumFormat(cell, numFmt);
};

/** Génère le format utilisé pour les nombres */
export const FORMAT_PERCENT = 'percent';
export const getNumberFormat = (value: Excel.CellValue, numFmt?: string) => {
  const suffix = numFmt === FORMAT_PERCENT ? '%' : '';

  // pas de virgule si le nombre est entier (ou null => forcé à 0)
  if (value === null || value === undefined || Number.isInteger(value)) {
    return `#,##0${suffix}`;
  }
  if (numFmt === FORMAT_PERCENT) {
    // un seul chiffre après la virgule pour les pourcentages
    return `0.#${suffix}`;
  }
  // deux chiffres après la virgule
  return `#,##0.0#${suffix}`;
};

/** Génère les options pour avoir une couleur de remplissage pour une/des cellule(s) d'une feuille xlsx */
export const makeSolidFill = (color: string) =>
  ({
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: color },
  } as Excel.Fill);

/** Applique un style à plusieurs cellules */
export const setCellsStyle = (
  worksheet: Excel.Worksheet,
  /** index (base-1) de la ligne à traiter */
  rowIndex: number,
  /** index (base-1) de la colonne de début */
  colStart: number,
  /** nombre des colonnes à traiter */
  colEnd: number,
  /** styles à appliquer */
  style: Partial<Excel.Style>
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

/** Passe la 1ère lettre d'une chaîne en capitale */
export const capitalize = (s: string | undefined | null) => {
  if (!s?.length) return '';
  const first = s.charAt(0).toUpperCase();
  return first + s.slice(1);
};

/** applique le formatage numérique aux colonnes points/scores à partir de l'index (base 1) donné */
export const setScoreFormats = (row: Excel.Row, colIndex: number) => {
  setCellNumFormat(row.getCell(colIndex));
  setCellNumFormat(row.getCell(colIndex + 1));
  setCellNumFormat(row.getCell(colIndex + 2), FORMAT_PERCENT);
  setCellNumFormat(row.getCell(colIndex + 3));
  setCellNumFormat(row.getCell(colIndex + 4), FORMAT_PERCENT);
  row.getCell(colIndex + 5).style.alignment = ALIGN_CENTER;
};

/** Couleurs de remplissage */
export const FILL = {
  grey: makeSolidFill('d8d8d8'),
  lightgrey: makeSolidFill('f2f2f2'),
  yellow: makeSolidFill('fffed6'),
};

// couleurs de fond des lignes par axe et sous-axe
const BG_COLORS: Record<number, string[]> = {
  1: ['f7caac', 'fbe4d5'],
  2: ['9bc1e5', 'bdd7ee'],
  3: ['70ae47', 'a9d08e'],
  4: ['fdd966', 'fee699'],
  5: ['8ea9db', 'b5c6e7'],
  6: ['9f5fce', 'bc8fdd'],
};

// couleur de fond ligne sous-sous-axe
const BG_COLOR3 = 'bfbfbf'; // niveau 3
const BG_COLOR4 = 'd8d8d8'; // niveau 4 (CAE seulement)

// styles pour les lignes d'en-tête
export const HEADING1 = {
  font: BOLD,
  alignment: ALIGN_CENTER,
  border: {
    top: BORDER_MEDIUM,
    left: BORDER_MEDIUM,
    right: BORDER_MEDIUM,
  },
} as Partial<Excel.Style>;

export const HEADING2 = {
  font: BOLD,
  alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
} as Partial<Excel.Style>;

export const HEADING_SCORES = {
  ...HEADING2,
  border: { top: BORDER_MEDIUM, bottom: BORDER_MEDIUM },
  fill: FILL.grey,
};

// détermine la couleur de fond d'une ligne en fonction de la profondeur dans l'arbo
export const getRowColor = (
  action: TActionReferentiel,
  referentiel: Enums<'referentiel'>
) => {
  if (action) {
    const { depth, identifiant } = action;
    if (depth === 3) return BG_COLOR3;
    if (depth === 4 && referentiel === 'cae') return BG_COLOR4;

    const axe = parseInt(identifiant.split('.')[0]);
    const colors = BG_COLORS[axe];
    if (colors && depth <= colors.length) return colors[depth - 1];
  }
};

// agrège les libellés (url ou nom de fichier) d'une liste de preuves
export const formatPreuves = (preuves?: TPreuve[]) =>
  preuves
    ?.map((p) => p?.lien?.url || p?.fichier?.filename || null)
    .filter((s) => !!s)
    .join('\n');
