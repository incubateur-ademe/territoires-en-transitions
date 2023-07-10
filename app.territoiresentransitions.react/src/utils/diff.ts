/** Renvoi la différence entre 2 tableaux */
export const diff = <T extends number | string | null>(
  array1: T[],
  array2: T[]
) => array1.filter(v => !array2.includes(v));
