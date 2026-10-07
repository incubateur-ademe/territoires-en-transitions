/** Extrait l'année d'une date ISO (`YYYY-MM-DD` ou datetime). */
export const getYearFromIsoDate = (isoDate: string): number =>
  Number(isoDate.slice(0, 4));
