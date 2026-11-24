type RegionalValues = {
  readonly ca2: string
  readonly ca4: string
  readonly ca5: string
  readonly ca8: string
}

const OLDER_YEAR_VALUES: RegionalValues = { ca2: '10', ca4: '20', ca5: '30', ca8: '40' }

function toRegionalSheet({
  code = '53',
  values,
  olderValues = OLDER_YEAR_VALUES,
}: {
  code?: unknown
  values: RegionalValues
  olderValues?: RegionalValues
}): readonly (readonly unknown[])[] {
  return [
    [code, 'Région'],
    [null, 'Mis à jour le: 07 juil. 2026'],
    [],
    ['PRODUCTION', null, 'Unité *', '2023', '2024'],
    ['CA1', 'Agriculture', 'GWh', '1', '2'],
    ['CA2', 'Produits pétroliers', 'GWh', olderValues.ca2, values.ca2],
    ['CA21', 'dont pêche', 'GWh', '9', '9'],
    ['CA4', 'Gaz naturel (CA3 *0,9)', 'GWh', olderValues.ca4, values.ca4],
    ['CA5', 'Électricité', 'GWh', olderValues.ca5, values.ca5],
    ['CA8', 'Chaleur commercialisée', 'GWh', olderValues.ca8, values.ca8],
  ]
}

export { OLDER_YEAR_VALUES, toRegionalSheet }
export type { RegionalValues }
