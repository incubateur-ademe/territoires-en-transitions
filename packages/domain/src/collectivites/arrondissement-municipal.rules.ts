/**
 * Arrondissements municipaux de Paris, Lyon et Marseille : chacun a son code
 * INSEE, mais les périmètres d'EPCI (Banatic) ne connaissent que la commune
 * entière. Plages fixes du COG.
 */
const ARRONDISSEMENTS_MUNICIPAUX: readonly {
  first: number;
  last: number;
  codeCommune: string;
}[] = [
  // Paris
  { first: 75101, last: 75120, codeCommune: '75056' },
  // Lyon
  { first: 69381, last: 69389, codeCommune: '69123' },
  // Marseille
  { first: 13201, last: 13216, codeCommune: '13055' },
];

/**
 * Code INSEE de la commune d'un arrondissement municipal, ou `null` si le code
 * n'est pas celui d'un arrondissement.
 */
export function getCodeCommuneOfArrondissement(
  communeCode: string | null | undefined
): string | null {
  if (!communeCode || !/^\d{5}$/.test(communeCode)) {
    return null;
  }
  const code = Number(communeCode);
  const arrondissements = ARRONDISSEMENTS_MUNICIPAUX.find(
    ({ first, last }) => code >= first && code <= last
  );
  return arrondissements?.codeCommune ?? null;
}
