// supprime les doublons d'une liste
export const dedup = <T extends string | number>(list: T[]) => [
  ...new Set(list),
];
