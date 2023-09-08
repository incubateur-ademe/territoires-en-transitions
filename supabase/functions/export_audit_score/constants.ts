import { Alignment, Border, Style } from 'https://esm.sh/exceljs@4.3.0';
import { makeSolidFill } from '../_shared/exportUtils.ts';

export const SCORE_HEADER_LABELS = [
  'Potentiel collectivité',
  'Points réalisés',
  '% réalisé',
  'Points programmés',
  '% programmé',
  'statut',
];

export const COLUMN_LABELS = [
  '', // identifiant action
  '', // intitulé action
  'Phase',
  'Potentiel max',
  ...SCORE_HEADER_LABELS,
  ...SCORE_HEADER_LABELS,
  "Champs de précision de l'état d'avancement",
  'Documents liés',
];

/** Couleurs de remplissage des cellule(s) */
export const Fills = {
  grey: makeSolidFill('d8d8d8'),
  lightgrey: makeSolidFill('f2f2f2'),
  yellow: makeSolidFill('fffed6'),
};

// couleurs de fond des lignes par axe et sous-axe
export const BG_COLORS: Record<number, string[]> = {
  1: ['f7caac', 'fbe4d5'],
  2: ['9bc1e5', 'bdd7ee'],
  3: ['70ae47', 'a9d08e'],
  4: ['fdd966', 'fee699'],
  5: ['8ea9db', 'b5c6e7'],
  6: ['9f5fce', 'bc8fdd'],
};

// couleur de fond ligne sous-sous-axe
export const BG_COLOR3 = 'bfbfbf';

// bordures
export const BORDER_MEDIUM = { style: 'medium' } as Partial<Border>;

// alignements
export const ALIGN_CENTER = {
  vertical: 'middle',
  horizontal: 'center',
} as Partial<Alignment>;
export const ALIGN_LEFT_WRAP = {
  horizontal: 'left',
  wrapText: true,
} as Partial<Alignment>;

// styles de fonte
export const BOLD = { bold: true };
export const ITALIC = { italic: true };

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
  fill: Fills.grey,
};
