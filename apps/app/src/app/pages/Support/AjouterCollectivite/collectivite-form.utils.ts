/** Vrai si la valeur est saisie mais n'a pas la longueur attendue. */
export const isIncomplete = (
  value: string | null | undefined,
  length: number
) => !!value && value.length !== length;
