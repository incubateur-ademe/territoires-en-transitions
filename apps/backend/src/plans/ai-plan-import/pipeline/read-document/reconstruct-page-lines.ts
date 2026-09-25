import { PageLine } from '../document/document-page';

/** Ce que pdf.js rend pour un fragment de texte (`TextItem`). */
export type TextItemLike = {
  str: string;
  /** Matrice [a, b, c, d, x, y] : la taille de police est |d|, l'origine (x, y) depuis le bas. */
  transform: number[];
  width: number;
  height: number;
};

type PositionedItem = {
  text: string;
  x: number;
  right: number;
  y: number;
  fontSize: number;
};

// Deux fragments sont sur la même ligne si leurs ordonnées diffèrent de moins
// d'une demi-hauteur de police ; ils sont séparés d'un espace si le blanc
// entre eux dépasse une fraction de cette hauteur (pdf.js coupe souvent aux
// mots sans rendre l'espace).
const SAME_LINE_TOLERANCE = 0.5;
const WORD_GAP_RATIO = 0.15;

/**
 * Recompose les lignes d'une page à partir des fragments de pdf.js, dans
 * l'ordre de lecture haut → bas puis gauche → droite. Les mises en page à
 * deux colonnes ressortent entrelacées : le texte reste complet, seulement
 * désordonné, ce que l'extraction tolère.
 */
export const reconstructPageLines = (
  items: TextItemLike[],
  pageHeight: number
): PageLine[] => {
  const positioned = items
    .filter((item) => item.str.length > 0)
    .map(toPositionedItem(pageHeight))
    .sort((a, b) => a.y - b.y || a.x - b.x);

  const lines: PositionedItem[][] = [];
  for (const item of positioned) {
    const current = lines.at(-1);
    const anchor = current?.[0];
    if (
      anchor &&
      Math.abs(item.y - anchor.y) <=
        SAME_LINE_TOLERANCE * Math.max(anchor.fontSize, item.fontSize, 1)
    ) {
      current.push(item);
    } else {
      lines.push([item]);
    }
  }

  return lines
    .map((line) => line.sort((a, b) => a.x - b.x))
    .map(toPageLine)
    .filter((line) => line.text.length > 0);
};

const toPositionedItem =
  (pageHeight: number) =>
  (item: TextItemLike): PositionedItem => {
    const [, , , d, x, y] = item.transform;
    const fontSize = Math.abs(d) || item.height || 1;
    return {
      text: item.str,
      x,
      right: x + item.width,
      y: pageHeight - y,
      fontSize,
    };
  };

const toPageLine = (items: PositionedItem[]): PageLine => {
  let text = '';
  let previous: PositionedItem | null = null;
  for (const item of items) {
    if (previous) {
      const gap = item.x - previous.right;
      const needsSpace =
        gap > WORD_GAP_RATIO * item.fontSize &&
        !text.endsWith(' ') &&
        !item.text.startsWith(' ');
      text += needsSpace ? ` ${item.text}` : item.text;
    } else {
      text = item.text;
    }
    previous = item;
  }
  return {
    text: text.replace(/\s+/g, ' ').trim(),
    fontSize: median(items.map((item) => item.fontSize)),
    y: items[0].y,
  };
};

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};
