const LIGATURES: Record<string, string> = {
  '\uFB00': 'ff',
  '\uFB01': 'fi',
  '\uFB02': 'fl',
  '\uFB03': 'ffi',
  '\uFB04': 'ffl',
};

// Glyphes sans correspondance Unicode (pdf.js rend U+0000) et demi-paires de
// surrogates : sans valeur pour le modèle, et refusés par Postgres en jsonb,
// où le point de reprise garde le texte.
// eslint-disable-next-line no-control-regex -- ce sont eux qu'on retire.
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const LONE_SURROGATES =
  /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;

/**
 * Ligatures, espaces insécables, caractères de contrôle. Ne retire rien en
 * début ni en fin : une tabulation de tête y sépare une colonne vide.
 */
export const cleanText = (text: string): string =>
  text
    .replace(CONTROL_CHARACTERS, '')
    .replace(LONE_SURROGATES, '\uFFFD')
    .replace(/[\uFB00-\uFB04]/g, (ligature) => LIGATURES[ligature] ?? ligature)
    .replace(/\u00A0/g, ' ')
    .replace(/ {2,}/g, ' ');
