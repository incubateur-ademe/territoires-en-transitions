/**
 * Fonctions utilitaires pour les exports
 */
import { format } from 'date-fns';
import { isNil } from 'es-toolkit';
import {
  Alignment,
  Border,
  Cell,
  CellValue,
  Fill,
  Style,
  Worksheet,
} from 'exceljs';

// bordures
export const BORDER_MEDIUM = { style: 'medium' } as Partial<Border>;

// alignements
export const ALIGN_CENTER = {
  vertical: 'middle',
  horizontal: 'center',
} as Partial<Alignment>;
export const ALIGN_LEFT_WRAP = {
  vertical: 'top',
  horizontal: 'left',
  wrapText: true,
} as Partial<Alignment>;
export const ALIGN_CENTER_WRAP = {
  ...ALIGN_CENTER,
  wrapText: true,
};

// styles de fonte
export const BOLD = { bold: true };
export const ITALIC = { italic: true };

/** Fixe le formatage d'une cellule contenant un montant en euros */
export const NUM_FORMAT_EURO = '#,##0.00 [$€-1]';
export const setEuroValue = (cell: Cell, value: number | undefined | null) => {
  cell.numFmt = NUM_FORMAT_EURO;
  cell.value = value || null;
};

/** Fixe le formatage numérique d'une cellule en fonction de sa valeur */
export const setCellNumFormat = (cell: Cell, numFmt?: string) => {
  cell.style = {
    ...cell.style,
    alignment: { horizontal: 'center' },
    numFmt: getNumberFormat(cell.value, numFmt),
  };
};

/* Fixe la valeur et le formatage numérique d'une cellule */
export const setNumValue = (
  cell: Cell,
  value: number | null,
  numFmt?: string
) => {
  cell.value = value;
  setCellNumFormat(cell, numFmt);
};

/** Génère le format utilisé pour les nombres */
export const FORMAT_PERCENT = 'percent';
export const getNumberFormat = (value: CellValue, numFmt?: string) => {
  if (isNil(value)) {
    return '';
  }

  if (numFmt === FORMAT_PERCENT) {
    const percentValue = Number(value) * 100;
    if (Number.isInteger(percentValue)) {
      return '0%';
    }
    return '0.0%';
  }

  // Pour les nombres normaux
  if (Number.isInteger(value)) {
    return '#,##0';
  }
  // deux chiffres après la virgule
  return '#,##0.0#';
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

/** Passe la 1ère lettre d'une chaîne en capitale */
export const capitalize = (s: string | undefined | null) => {
  if (!s?.length) return '';
  const first = s.charAt(0).toUpperCase();
  return first + s.slice(1);
};

/** Couleurs de remplissage */
export const FILL = {
  primary: makeSolidFill('6A6AF4'),
  grey: makeSolidFill('d8d8d8'),
  lightgrey: makeSolidFill('f2f2f2'),
  yellow: makeSolidFill('fffed6'),
};

// styles pour les lignes d'en-tête
export const HEADING1 = {
  font: BOLD,
  alignment: ALIGN_CENTER,
  border: {
    top: BORDER_MEDIUM,
    left: BORDER_MEDIUM,
    right: BORDER_MEDIUM,
  },
} as Partial<Style>;

export const HEADING2 = {
  font: BOLD,
  alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
} as Partial<Style>;

export const HEADING_SCORES = {
  ...HEADING2,
  border: { top: BORDER_MEDIUM, bottom: BORDER_MEDIUM },
  fill: FILL.grey,
};

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

export const formatDate = (dateStr: Date | string | null | undefined) => {
  return dateStr ? format(new Date(dateStr), 'dd/MM/yyyy') : '';
};

/**
 * Nettoie une description HTML pour la rendre lisible dans Excel
 * - Supprime toutes les balises HTML
 * - Convertit les listes en texte avec puces
 * - Gère les paragraphes avec des retours à la ligne
 * - Nettoie les espaces en trop
 */
export const cleanHtmlDescription = (htmlDescription: string): string => {
  if (!htmlDescription) {
    return '';
  }

  let cleaned = htmlDescription;

  // Remplace les éléments de liste par des puces (gérer les <p> dans <li>)
  cleaned = cleaned.replace(/<li[^>]*>\s*<p[^>]*>/g, '• ');
  cleaned = cleaned.replace(/<\/p>\s*<\/li>/g, '\n');

  // Gère les li simples sans p
  cleaned = cleaned.replace(/<li[^>]*>/g, '• ');
  cleaned = cleaned.replace(/<\/li>/g, '\n');

  // Remplace les paragraphes par des retours à la ligne
  cleaned = cleaned.replace(/<\/p>/g, '\n');
  cleaned = cleaned.replace(/<p[^>]*>/g, '');

  // Remplace les listes par des retours à la ligne
  cleaned = cleaned.replace(/<\/?ul[^>]*>/g, '\n');
  cleaned = cleaned.replace(/<\/?ol[^>]*>/g, '\n');

  // Remplace les divs par des retours à la ligne
  cleaned = cleaned.replace(/<\/div>/g, '\n');
  cleaned = cleaned.replace(/<div[^>]*>/g, '');

  // Remplace les br par des retours à la ligne
  cleaned = cleaned.replace(/<br[^>]*\/?>/g, '\n');

  // Supprime toutes les autres balises HTML
  cleaned = cleaned.replace(/<[^>]*>/g, '');

  // Décode les entités HTML communes
  cleaned = cleaned.replace(/&nbsp;/g, ' ');
  cleaned = cleaned.replace(/&amp;/g, '&');
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&gt;/g, '>');
  cleaned = cleaned.replace(/&quot;/g, '"');
  cleaned = cleaned.replace(/&#39;/g, "'");

  // Nettoie les espaces et retours à la ligne en trop
  cleaned = cleaned.replace(/\n+/g, '\n'); // Supprime les lignes vides multiples
  cleaned = cleaned.replace(/^\s+|\s+$/g, ''); // Supprime les espaces en début/fin
  cleaned = cleaned.replace(/[ \t]+/g, ' '); // Normalise les espaces
  cleaned = cleaned.replace(/\n\s+/g, '\n'); // Supprime les espaces après retour ligne

  return cleaned;
};
