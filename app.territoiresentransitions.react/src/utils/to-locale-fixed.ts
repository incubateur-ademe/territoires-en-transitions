/**
 * Formate un nombre avec le nombre de décimales voulu et en tenant compte de la
 * langue du navigateur (utilise la virgule comme séparateur des décimales, et
 * l'espace comme séparateur des milliers en français)
 */
export const toLocaleFixed = (n: number, maximumFractionDigits = 1): string =>
  n ? n.toLocaleString(undefined, { maximumFractionDigits }) : '0';
