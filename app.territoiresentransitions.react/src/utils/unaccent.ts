/**
 * Retire les accents d'une chaîne de caractères
 *
 */
export const unaccent = (s: string) =>
  s
    // décomposition des combinaisons de *code point*
    // par exemple "é" devient "\u0065\u0301", c'est-à-dire la lettre "e" suivi de l'accent aigu
    .normalize('NFD')
    // supprime la plage de caractères unicode associés aux accents
    .replace(/[\u0300-\u036f]/g, '');
