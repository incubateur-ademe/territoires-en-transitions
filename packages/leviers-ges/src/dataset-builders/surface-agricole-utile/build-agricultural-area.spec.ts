import { omit } from 'es-toolkit'
import { describe, expect, it } from 'vitest'
import type { DataRow } from '../../domain/data-source.ts'
import {
  buildAgriculturalArea,
  COMMUNE_CODE_CHANGES,
  type AgriculturalAreaSources,
} from './build-agricultural-area.ts'

const COMMUNES: readonly DataRow[] = [
  { code_commune: '01001', code_departement: '01', code_region: '84' },
  { code_commune: '01002', code_departement: '01', code_region: '84' },
  { code_commune: '12218', code_departement: '12', code_region: '76' },
  { code_commune: '49126', code_departement: '49', code_region: '52' },
  { code_commune: '49160', code_departement: '49', code_region: '52' },
]

function toCsv(header: string, ...lines: string[]): string {
  return [header, ...lines].join('\n')
}

const COMMUNE_HEADER = 'date_mesure,geocode_commune,libelle_commune,valeur'
const REGION_HEADER = 'date_mesure,geocode_region,libelle_region,valeur'
const DEPARTEMENT_HEADER = 'date_mesure,geocode_departement,libelle_departement,valeur'
const T2020 = '2020-01-01T00:00:00.000'
const T2010 = '2010-01-01T00:00:00.000'

function toSources(overrides: Partial<AgriculturalAreaSources> = {}): AgriculturalAreaSources {
  return {
    communeCsv: toCsv(
      COMMUNE_HEADER,
      `${T2010},01001,A,999`,
      `${T2020},01001,A,100.5`,
      `${T2020},01002,B,200`,
      `${T2020},12076,Conques-en-Rouergue,50`,
      `${T2020},49321,Saint-Sigismond,7`,
      `${T2020},49160,Ingrandes,3`,
    ),
    regionCsv: toCsv(
      REGION_HEADER,
      `${T2010},84,Auvergne,1`,
      `${T2020},84,Auvergne,300.5`,
      `${T2020},76,Occitanie,50`,
      `${T2020},52,Pays de la Loire,10`,
    ),
    departementCsv: toCsv(
      DEPARTEMENT_HEADER,
      `${T2020},01,Ain,300.5`,
      `${T2020},12,Aveyron,50`,
      `${T2020},49,Maine-et-Loire,10`,
    ),
    communes: COMMUNES,
    ...overrides,
  }
}

describe('buildAgriculturalArea', () => {
  const build = buildAgriculturalArea(toSources())._unsafeUnwrap()

  it('écrit la SAU de 2020 par commune actuelle, triée par code', () => {
    expect(build.csv).toBe(
      [
        'code_commune,agricultural_area_ha',
        '01001,100.5',
        '01002,200',
        '12218,50',
        '49160,10',
        '',
      ].join('\n'),
    )
  })

  it('ignore le recensement de 2010, même pour une commune présente seulement en 2010', () => {
    const only2010 = buildAgriculturalArea(
      toSources({
        communeCsv: toCsv(
          COMMUNE_HEADER,
          `${T2010},01002,B,555`,
          `${T2020},01001,A,100.5`,
          `${T2020},01002,B,200`,
          `${T2020},12076,C,50`,
          `${T2020},49321,D,7`,
          `${T2020},49160,E,3`,
        ),
      }),
    )._unsafeUnwrap()
    expect(only2010.csv).toBe(build.csv)
    expect(build.csv).not.toContain('999')
  })

  it('écrit une commune à 0 ha, qui vaut une commune absente pour le consommateur', () => {
    const withZero = buildAgriculturalArea(
      toSources({
        communeCsv: toCsv(
          COMMUNE_HEADER,
          `${T2020},01001,A,100.5`,
          `${T2020},01002,B,200`,
          `${T2020},12076,C,50`,
          `${T2020},49321,D,7`,
          `${T2020},49160,E,0`,
        ),
        regionCsv: toCsv(
          REGION_HEADER,
          `${T2020},84,A,300.5`,
          `${T2020},76,B,50`,
          `${T2020},52,C,7`,
        ),
        departementCsv: toCsv(
          DEPARTEMENT_HEADER,
          `${T2020},01,A,300.5`,
          `${T2020},12,B,50`,
          `${T2020},49,C,7`,
        ),
      }),
    )._unsafeUnwrap()
    expect(withZero.csv).toContain('49160,7\n')
  })

  it('ramène chaque ancien code à une commune du même département', () => {
    const departementPrefixLength = 2
    const crossing = [...COMMUNE_CODE_CHANGES].filter(
      ([oldCode, currentCode]) =>
        oldCode.slice(0, departementPrefixLength) !== currentCode.slice(0, departementPrefixLength),
    )
    expect(crossing).toEqual([])
  })

  it('ramène un ancien code à la commune actuelle et ajoute la SAU d’une commune absorbée', () => {
    expect(build.csv).toContain('12218,50')
    expect(build.csv).toContain('49160,10')
    expect(build.csv).not.toContain('12076')
    expect(build.csv).not.toContain('49321')
  })

  it('dénombre les communes écrites, les codes recodés et le total', () => {
    expect({
      communes: build.communeCount,
      recoded: build.recodedCommuneCount,
      totalHectares: build.totalHectares,
    }).toEqual({ communes: 4, recoded: 2, totalHectares: '360.5' })
  })

  it('arrondit le bruit de flottant de la source à 12 décimales', () => {
    const noisy = buildAgriculturalArea(
      toSources({
        communeCsv: toCsv(
          COMMUNE_HEADER,
          `${T2020},01001,A,100.50000000000003`,
          `${T2020},01002,B,200`,
          `${T2020},12076,C,50`,
          `${T2020},49321,D,7`,
          `${T2020},49160,E,3`,
        ),
      }),
    )._unsafeUnwrap()
    expect(noisy.csv).toContain('01001,100.5\n')
  })

  describe('contrôle contre les fichiers régional et départemental', () => {
    it('accepte un écart sous le seuil', () => {
      const result = buildAgriculturalArea(
        toSources({
          regionCsv: toCsv(
            REGION_HEADER,
            `${T2020},84,A,300.5000001`,
            `${T2020},76,B,50`,
            `${T2020},52,C,10`,
          ),
        }),
      )
      expect(result.isOk()).toBe(true)
    })

    it('refuse un écart juste au-dessus du seuil de 10⁻⁶ ha', () => {
      const result = buildAgriculturalArea(
        toSources({
          regionCsv: toCsv(
            REGION_HEADER,
            `${T2020},84,A,300.500002`,
            `${T2020},76,B,50`,
            `${T2020},52,C,10`,
          ),
        }),
      )
      expect(result._unsafeUnwrapErr()).toMatchObject({
        dataset: 'surface-agricole-utile/sources/sau-region.csv',
        reason: 'control_total_mismatch',
      })
    })

    it('refuse une région dont la somme des communes diffère', () => {
      const result = buildAgriculturalArea(
        toSources({
          regionCsv: toCsv(
            REGION_HEADER,
            `${T2020},84,A,301`,
            `${T2020},76,B,50`,
            `${T2020},52,C,10`,
          ),
        }),
      )
      expect(result._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_dataset',
        dataset: 'surface-agricole-utile/sources/sau-region.csv',
        reason: 'control_total_mismatch',
        detail: '84: the communes differ from the file by -0.5',
      })
    })

    it('refuse un département dont la somme des communes diffère', () => {
      const result = buildAgriculturalArea(
        toSources({
          departementCsv: toCsv(
            DEPARTEMENT_HEADER,
            `${T2020},01,A,300.5`,
            `${T2020},12,B,51`,
            `${T2020},49,C,10`,
          ),
        }),
      )
      expect(result._unsafeUnwrapErr()).toMatchObject({
        dataset: 'surface-agricole-utile/sources/sau-departement.csv',
        reason: 'control_total_mismatch',
        detail: '12: the communes differ from the file by -1',
      })
    })

    it('refuse une région que le fichier régional ne connaît pas', () => {
      const result = buildAgriculturalArea(
        toSources({ regionCsv: toCsv(REGION_HEADER, `${T2020},84,A,300.5`, `${T2020},76,B,50`) }),
      )
      expect(result._unsafeUnwrapErr()).toMatchObject({
        dataset: 'surface-agricole-utile/sources/sau-region.csv',
        detail: '52: the communes differ from the file by 10',
      })
    })

    it('refuse une région du fichier régional sans aucune commune', () => {
      const result = buildAgriculturalArea(
        toSources({
          regionCsv: toCsv(
            REGION_HEADER,
            `${T2020},84,A,300.5`,
            `${T2020},76,B,50`,
            `${T2020},52,C,10`,
            `${T2020},11,D,5`,
          ),
        }),
      )
      expect(result._unsafeUnwrapErr()).toMatchObject({
        dataset: 'surface-agricole-utile/sources/sau-region.csv',
        detail: '11: the communes differ from the file by -5',
      })
    })
  })

  describe('erreurs', () => {
    it('refuse un ancien code recodé vers une commune absente de la géographie', () => {
      const result = buildAgriculturalArea(
        toSources({ communes: COMMUNES.filter((row) => row['code_commune'] !== '12218') }),
      )
      expect(result._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_dataset',
        dataset: 'surface-agricole-utile/sources/sau-commune.csv',
        reason: 'columns_mismatch',
        detail: 'commune 12218 is not in territoires/communes',
      })
    })

    it.each([
      ['communeCsv', COMMUNE_HEADER, 'surface-agricole-utile/sources/sau-commune.csv'],
      ['regionCsv', REGION_HEADER, 'surface-agricole-utile/sources/sau-region.csv'],
      ['departementCsv', DEPARTEMENT_HEADER, 'surface-agricole-utile/sources/sau-departement.csv'],
    ] as const)('refuse un fichier %s sans aucune ligne de 2020', (key, header, dataset) => {
      const result = buildAgriculturalArea(
        toSources({ [key]: toCsv(header, `${T2010},01,A,1`) }),
      )
      expect(result._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_dataset',
        dataset,
        reason: 'empty_dataset',
        detail: 'no line dated 2020-',
      })
    })

    it('refuse une commune de la géographie qui n’est pas dans le jeu mais que la région attend', () => {
      const result = buildAgriculturalArea(
        toSources({
          communeCsv: toCsv(
            COMMUNE_HEADER,
            `${T2020},01001,A,100.5`,
            `${T2020},12076,B,50`,
            `${T2020},49321,C,7`,
            `${T2020},49160,D,3`,
          ),
        }),
      )
      expect(result._unsafeUnwrapErr()).toMatchObject({
        dataset: 'surface-agricole-utile/sources/sau-region.csv',
        reason: 'control_total_mismatch',
        detail: '84: the communes differ from the file by -200',
      })
    })

    it('refuse une commune, recodée ou non, qui n’est pas dans la géographie', () => {
      const result = buildAgriculturalArea(
        toSources({
          communeCsv: toCsv(COMMUNE_HEADER, `${T2020},99999,Inconnue,1`),
        }),
      )
      expect(result._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_dataset',
        dataset: 'surface-agricole-utile/sources/sau-commune.csv',
        reason: 'columns_mismatch',
        detail: 'commune 99999 is not in territoires/communes',
      })
    })

    it('refuse une surface qui n’est pas un nombre', () => {
      const result = buildAgriculturalArea(
        toSources({ communeCsv: toCsv(COMMUNE_HEADER, `${T2020},01001,A,beaucoup`) }),
      )
      expect(result._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_dataset',
        dataset: 'surface-agricole-utile/sources/sau-commune.csv',
        reason: 'unreadable',
        detail: 'valeur=beaucoup is not a decimal number',
      })
    })

    it.each([
      ['communeCsv', 'surface-agricole-utile/sources/sau-commune.csv', 'geocode_commune'],
      ['regionCsv', 'surface-agricole-utile/sources/sau-region.csv', 'geocode_region'],
      ['departementCsv', 'surface-agricole-utile/sources/sau-departement.csv', 'geocode_departement'],
    ] as const)('refuse un fichier %s sans sa colonne clé', (key, dataset, column) => {
      const csv = toCsv('date_mesure,libelle,valeur', `${T2020},A,1`)
      const result = buildAgriculturalArea(toSources({ [key]: csv }))
      expect(result._unsafeUnwrapErr()).toMatchObject({
        dataset,
        reason: 'columns_mismatch',
        detail: column,
      })
    })

    it('refuse un fichier dont une ligne n’a pas le bon nombre de colonnes', () => {
      const result = buildAgriculturalArea(
        toSources({ communeCsv: toCsv(COMMUNE_HEADER, `${T2020},01001,A,1,en trop`) }),
      )
      expect(result._unsafeUnwrapErr()).toMatchObject({
        dataset: 'surface-agricole-utile/sources/sau-commune.csv',
        reason: 'malformed_csv',
      })
    })

    it.each(['code_commune', 'code_region', 'code_departement'])(
      'refuse une géographie sans la colonne %s',
      (column) => {
        const row: DataRow = { code_commune: '01001', code_departement: '01', code_region: '84' }
        const result = buildAgriculturalArea(toSources({ communes: [omit(row, [column])] }))
        expect(result._unsafeUnwrapErr()).toMatchObject({
          dataset: 'territoires/communes',
          reason: 'columns_mismatch',
          detail: column,
        })
      },
    )

    it('refuse un code de commune qui obligerait à protéger le CSV produit', () => {
      const result = buildAgriculturalArea(
        toSources({
          communeCsv: toCsv(COMMUNE_HEADER, `${T2020},"a,b",A,1`),
          regionCsv: toCsv(REGION_HEADER, `${T2020},84,A,1`),
          departementCsv: toCsv(DEPARTEMENT_HEADER, `${T2020},01,A,1`),
          communes: [{ code_commune: 'a,b', code_departement: '01', code_region: '84' }],
        }),
      )
      expect(result._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_dataset',
        dataset: 'surface-agricole-utile/sources/sau-commune.csv',
        reason: 'malformed_csv',
        detail: 'field a,b needs CSV quoting',
      })
    })
  })
})
