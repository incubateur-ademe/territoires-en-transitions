import { describe, expect, it } from 'vitest'
import { buildHousingSurfaces } from './build-housing-surfaces.ts'
import { HOUSING_COLUMNS } from './housing-cells.ts'

const FIRST_COLUMN = 'housing_m2_house_heat_network_before_1971'
const LAST_COLUMN = 'housing_m2_social_apartment_other_after_2005'

function cells({ first, last }: { first: string; last: string }): string {
  return HOUSING_COLUMNS.map((column) =>
    column === FIRST_COLUMN ? first : column === LAST_COLUMN ? last : '0',
  ).join(',')
}

function housing(...lines: readonly string[]): string {
  return `${['commune,epci,departement,' + HOUSING_COLUMNS.join(','), ...lines].join('\n')}\n`
}

const HOUSING_CSV = housing(
  `02001,200000002,02,${cells({ first: '5', last: '1' })}`,
  `01002,200000001,01,${cells({ first: '0.5', last: '2' })}`,
  `01001,200000001,01,${cells({ first: '1.25', last: '3' })}`,
  `22016,,22,${cells({ first: '7', last: '0' })}`,
)

function valuesOf(csv: string): readonly Record<string, string>[] {
  const [header = '', ...rows] = csv.trim().split('\n')
  const columns = header.split(',')
  return rows.map((row) =>
    Object.fromEntries(
      row
        .split(',')
        .flatMap((value, index) =>
          [FIRST_COLUMN, LAST_COLUMN, 'epci_departement', 'code_departement'].includes(
            columns[index] ?? '',
          )
            ? [[columns[index] ?? '', value]]
            : [],
        ),
    ),
  )
}

describe('buildHousingSurfaces', () => {
  const built = buildHousingSurfaces(HOUSING_CSV)._unsafeUnwrap()

  it('somme les communes d’un même couple EPCI-département, triées par EPCI puis département', () => {
    expect(valuesOf(built.epciDepartementsCsv)).toEqual([
      { epci_departement: '200000001-01', code_departement: '01', [FIRST_COLUMN]: '1.75', [LAST_COLUMN]: '5' },
      { epci_departement: '200000002-02', code_departement: '02', [FIRST_COLUMN]: '5', [LAST_COLUMN]: '1' },
    ])
  })

  it('écrit les départements triés, communes sans EPCI comprises', () => {
    expect(valuesOf(built.departementsCsv)).toEqual([
      { code_departement: '01', [FIRST_COLUMN]: '1.75', [LAST_COLUMN]: '5' },
      { code_departement: '02', [FIRST_COLUMN]: '5', [LAST_COLUMN]: '1' },
      { code_departement: '22', [FIRST_COLUMN]: '7', [LAST_COLUMN]: '0' },
    ])
  })

  it('compte les lignes et totalise les m² : la commune sans EPCI n’est que dans les départements', () => {
    expect({
      epciDepartements: built.epciDepartementCount,
      departements: built.departementCount,
      epciDepartementsSquareMetres: built.epciDepartementsSquareMetres,
      departementsSquareMetres: built.departementsSquareMetres,
    }).toEqual({
      epciDepartements: 2,
      departements: 3,
      epciDepartementsSquareMetres: '12.75',
      departementsSquareMetres: '19.75',
    })
  })

  it('écrit les 54 colonnes de surface après les clés', () => {
    expect(built.departementsCsv.split('\n')[0]?.split(',')).toEqual([
      'code_departement',
      ...HOUSING_COLUMNS,
    ])
  })

  it('refuse d’écrire un code EPCI qui exigerait un guillemet CSV', () => {
    expect(
      buildHousingSurfaces(housing(`01001,"20,1",01,${cells({ first: '1', last: '1' })}`))._unsafeUnwrapErr(),
    ).toMatchObject({ dataset: 'residentiel-logements/logements-epci-departement.csv', reason: 'malformed_csv' })
  })
})
