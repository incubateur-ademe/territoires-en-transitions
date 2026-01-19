/**
 * Regex dont le premier groupe revoie les suites de nombres
 * et le deuxième le reste.
 */
const regex = /0*([0-9]+)|([^0-9]+)/g;

/**
 * Transforme un texte en un texte dont la comparaison permettra
 * un ordonnancement naturel.
 */
function comparable(text: string): string {
  return [...text.matchAll(regex)]
    .map((m) =>
      m[2]
        ? m[2]
        : m[0].length.toString().length.toString() +
          m[0].length.toString() +
          m[0]
    )
    .join('');
}

/**
 * La fonction de comparaison utilisée par la fonction "sort".
 */
export function naturalSort(a: string, b: string) {
  const ca = comparable(a.toLowerCase());
  const cb = comparable(b.toLowerCase());
  if (ca < cb) {
    return -1;
  }
  if (ca > cb) {
    return 1;
  }
  return 0;
}
