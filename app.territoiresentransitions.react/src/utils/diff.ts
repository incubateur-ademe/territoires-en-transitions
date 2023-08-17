/**
 * Renvoi la différence entre 2 tableaux sous la forme de deux nouveaux tableaux :
 * - les éléments de `array1` non présents dans `array2`
 * - les éléments de `array2` non présents dans `array1`
 */
export const diff = <T extends number | string | null>(
  array1: T[],
  array2: T[]
) => [compare(array1, array2), compare(array2, array1)];

/** Renvoi les éléments de `array1` non présents dans `array2` */
const compare = <T extends number | string | null>(array1: T[], array2: T[]) =>
  array1.filter(v => !array2.includes(v));
