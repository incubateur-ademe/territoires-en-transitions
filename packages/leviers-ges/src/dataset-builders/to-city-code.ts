type DistrictRange = { readonly first: string; readonly last: string; readonly city: string }

// Source : geo.api.gouv.fr, arrondissements municipaux relevés le 2026-10-07 : Paris 75101 à 75120, Lyon 69381 à 69389, Marseille 13201 à 13216, rattachés à leur commune (choix de modélisation, à valider)
const DISTRICT_RANGES: readonly DistrictRange[] = [
  { first: '75101', last: '75120', city: '75056' },
  { first: '69381', last: '69389', city: '69123' },
  { first: '13201', last: '13216', city: '13055' },
]

// Source : Insee, code officiel géographique : un code de commune ou d'arrondissement numérique compte 5 chiffres
const NUMERIC_COMMUNE_CODE = /^\d{5}$/

function toCityCode(communeCode: string): string {
  if (!NUMERIC_COMMUNE_CODE.test(communeCode)) return communeCode
  const range = DISTRICT_RANGES.find(
    ({ first, last }) => first <= communeCode && communeCode <= last,
  )
  return range?.city ?? communeCode
}

export { toCityCode }
