export type PageLine = {
  text: string;
  /** Taille de police médiane de la ligne, PDF texte seulement. */
  fontSize?: number;
  /** Ordonnée depuis le haut de la page, en unités PDF. */
  y?: number;
};

export type DocumentPage = {
  /** 0-based ; la page affichée est `index + 1`. */
  index: number;
  text: string;
  lines: PageLine[];
  source: 'text' | 'ocr' | 'empty';
  /** Caractères hors espaces : ce qui départage une page vide d'une page lue. */
  charCount: number;
  /** Nom de la feuille pour un tableur. */
  label?: string;
  width?: number;
  height?: number;
};

export type DocumentKind = 'pdf' | 'docx' | 'xlsx' | 'csv';

/** Un tableur : la première ligne est l'en-tête, chaque ligne une entrée. */
export const isTabularKind = (kind: DocumentKind): boolean =>
  kind === 'xlsx' || kind === 'csv';

export type ReadDocument = {
  kind: DocumentKind;
  pages: DocumentPage[];
  stats: {
    pageCount: number;
    textPages: number;
    ocrPages: number;
    emptyPages: number;
  };
};

export const buildPage = (
  index: number,
  lines: PageLine[],
  extra: Partial<
    Pick<DocumentPage, 'source' | 'label' | 'width' | 'height'>
  > = {}
): DocumentPage => {
  const text = lines.map((line) => line.text).join('\n');
  const charCount = text.replace(/\s/g, '').length;
  return {
    index,
    text,
    lines,
    source: extra.source ?? (charCount > 0 ? 'text' : 'empty'),
    charCount,
    ...(extra.label !== undefined ? { label: extra.label } : {}),
    ...(extra.width !== undefined ? { width: extra.width } : {}),
    ...(extra.height !== undefined ? { height: extra.height } : {}),
  };
};

export const buildDocument = (
  kind: DocumentKind,
  pages: DocumentPage[]
): ReadDocument => ({
  kind,
  pages,
  stats: {
    pageCount: pages.length,
    textPages: pages.filter((page) => page.source === 'text').length,
    ocrPages: pages.filter((page) => page.source === 'ocr').length,
    emptyPages: pages.filter((page) => page.source === 'empty').length,
  },
});

/** Le texte du document, une page après l'autre. */
export const joinPages = (document: ReadDocument): string =>
  document.pages
    .map((page) => page.text)
    .filter((text) => text.trim().length > 0)
    .join('\n');
