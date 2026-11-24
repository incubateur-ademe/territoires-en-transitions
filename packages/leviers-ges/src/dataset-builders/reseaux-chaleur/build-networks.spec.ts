import { describe, expect, it } from 'vitest'
import { buildNetworks } from './build-networks.ts'

const SDES_HEADER = 'ID;COMMUNE_CODE;CONSOTOT;CONTENU_EN_CO2'
const FCU_HEADER = 'identifiant_reseau,contenu_co2_kgco2_kwh'
const NETWORKS_HEADER =
  'network_id,commune_code,delivered_mwh,emission_factor_kg_per_kwh,emission_factor_source'

function toSdesCsv(...lines: string[]): string {
  return [SDES_HEADER, ...lines].join('\n')
}

function toFcuCsv(...lines: string[]): string {
  return [FCU_HEADER, ...lines].join('\n')
}

function toNetworksCsv(...lines: string[]): string {
  return `${[NETWORKS_HEADER, ...lines].join('\n')}\n`
}

describe('buildNetworks', () => {
  it('trie par identifiant et prend le facteur de France Chaleur Urbaine avant celui du SDES', () => {
    const build = buildNetworks({
      sdesCsv: toSdesCsv('B;01001;200;0.5', 'A;01002;100;0.25'),
      fcuCsv: toFcuCsv('B,0.1'),
    })._unsafeUnwrap()
    expect(build).toEqual({
      csv: toNetworksCsv('A,01002,100,0.25,sdes', 'B,01001,200,0.1,fcu'),
      networkCount: 2,
      secretNetworkCount: 0,
      totalDeliveredMwh: '300',
    })
  })

  it('écarte les réseaux sous secret statistique et les compte', () => {
    const build = buildNetworks({
      sdesCsv: toSdesCsv('A;01001;secret;', 'B;01002;40;0.2'),
      fcuCsv: toFcuCsv(),
    })._unsafeUnwrap()
    expect(build).toEqual({
      csv: toNetworksCsv('B,01002,40,0.2,sdes'),
      networkCount: 1,
      secretNetworkCount: 1,
      totalDeliveredMwh: '40',
    })
  })

  it('retombe sur le facteur du SDES quand France Chaleur Urbaine n’en donne pas', () => {
    const build = buildNetworks({
      sdesCsv: toSdesCsv('A;01001;10;0.3', 'B;01002;20;0.4'),
      fcuCsv: toFcuCsv('A,', ',0.9'),
    })._unsafeUnwrap()
    expect(build.csv).toBe(toNetworksCsv('A,01001,10,0.3,sdes', 'B,01002,20,0.4,sdes'))
  })

  it('garde la dernière ligne France Chaleur Urbaine d’un même réseau', () => {
    const build = buildNetworks({
      sdesCsv: toSdesCsv('A;01001;10;0.3'),
      fcuCsv: toFcuCsv('A,0.1', 'A,'),
    })._unsafeUnwrap()
    expect(build.csv).toBe(toNetworksCsv('A,01001,10,0.3,sdes'))
  })

  it('rattache l’arrondissement d’une commune à sa commune', () => {
    const build = buildNetworks({
      sdesCsv: toSdesCsv('A;75101;10;0.3'),
      fcuCsv: toFcuCsv(),
    })._unsafeUnwrap()
    expect(build.csv).toBe(toNetworksCsv('A,75056,10,0.3,sdes'))
  })

  it.each([
    ['1.0000000000005', '1.000000000001'],
    ['1.0000000000004', '1'],
    ['0.1000000000000', '0.1'],
    ['12', '12'],
    ['0', '0'],
  ])('arrondit la livraison %s à 12 décimales, soit %s', (delivered, expected) => {
    const build = buildNetworks({
      sdesCsv: toSdesCsv(`A;01001;${delivered};0.3`),
      fcuCsv: toFcuCsv(),
    })._unsafeUnwrap()
    expect(build.csv).toBe(toNetworksCsv(`A,01001,${expected},0.3,sdes`))
  })

  it('arrondit le facteur France Chaleur Urbaine à 12 décimales', () => {
    const build = buildNetworks({
      sdesCsv: toSdesCsv('A;01001;10;0.3'),
      fcuCsv: toFcuCsv('A,0.0000000000005'),
    })._unsafeUnwrap()
    expect(build.csv).toBe(toNetworksCsv('A,01001,10,0.000000000001,fcu'))
  })

  it('additionne les livraisons sans erreur de flottant', () => {
    const build = buildNetworks({
      sdesCsv: toSdesCsv('A;01001;0.1;0.3', 'B;01002;0.2;0.3'),
      fcuCsv: toFcuCsv(),
    })._unsafeUnwrap()
    expect(build.totalDeliveredMwh).toBe('0.3')
  })

  describe('erreurs', () => {
    it('refuse une livraison qui n’est pas un nombre décimal', () => {
      const result = buildNetworks({ sdesCsv: toSdesCsv('A;01001;beaucoup;0.3'), fcuCsv: toFcuCsv() })
      expect(result._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_dataset',
        dataset: 'reseaux-chaleur/sources/sdes-chaleur-commune-2024.csv',
        reason: 'unreadable',
        detail: 'CONSOTOT=beaucoup is not a decimal number',
      })
    })

    it('refuse un facteur France Chaleur Urbaine qui n’est pas un nombre décimal', () => {
      const result = buildNetworks({ sdesCsv: toSdesCsv('A;01001;10;0.3'), fcuCsv: toFcuCsv('A,abc') })
      expect(result._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_dataset',
        dataset: 'reseaux-chaleur/sources/fcu-reseaux-chaleur.csv',
        reason: 'unreadable',
        detail: 'contenu_co2_kgco2_kwh=abc is not a decimal number',
      })
    })

    it('refuse un facteur du SDES qui n’est pas un nombre décimal', () => {
      const result = buildNetworks({ sdesCsv: toSdesCsv('A;01001;10;'), fcuCsv: toFcuCsv() })
      expect(result._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_dataset',
        dataset: 'reseaux-chaleur/sources/sdes-chaleur-commune-2024.csv',
        reason: 'unreadable',
        detail: 'CONTENU_EN_CO2= is not a decimal number',
      })
    })

    it.each(['ID', 'COMMUNE_CODE', 'CONSOTOT', 'CONTENU_EN_CO2'])(
      'refuse un fichier SDES sans la colonne %s',
      (column) => {
        const header = SDES_HEADER.split(';')
          .filter((name) => name !== column)
          .join(';')
        const row = SDES_HEADER.split(';')
          .filter((name) => name !== column)
          .map(() => '1')
          .join(';')
        const result = buildNetworks({ sdesCsv: `${header}\n${row}`, fcuCsv: toFcuCsv() })
        expect(result._unsafeUnwrapErr()).toMatchObject({
          dataset: 'reseaux-chaleur/sources/sdes-chaleur-commune-2024.csv',
          reason: 'columns_mismatch',
          detail: column,
        })
      },
    )

    it.each(['identifiant_reseau', 'contenu_co2_kgco2_kwh'])(
      'refuse un fichier France Chaleur Urbaine sans la colonne %s',
      (column) => {
        const header = FCU_HEADER.split(',')
          .filter((name) => name !== column)
          .join(',')
        const result = buildNetworks({
          sdesCsv: toSdesCsv('A;01001;10;0.3'),
          fcuCsv: `${header}\nvaleur`,
        })
        expect(result._unsafeUnwrapErr()).toMatchObject({
          dataset: 'reseaux-chaleur/sources/fcu-reseaux-chaleur.csv',
          reason: 'columns_mismatch',
          detail: column,
        })
      },
    )

    it('refuse un fichier SDES dont une ligne n’a pas le bon nombre de colonnes', () => {
      const result = buildNetworks({ sdesCsv: toSdesCsv('A;01001;10;0.3;en trop'), fcuCsv: toFcuCsv() })
      expect(result._unsafeUnwrapErr()).toMatchObject({
        dataset: 'reseaux-chaleur/sources/sdes-chaleur-commune-2024.csv',
        reason: 'malformed_csv',
      })
    })

    it('refuse un fichier France Chaleur Urbaine dont une ligne n’a pas le bon nombre de colonnes', () => {
      const result = buildNetworks({
        sdesCsv: toSdesCsv('A;01001;10;0.3'),
        fcuCsv: toFcuCsv('A,0.1,en trop'),
      })
      expect(result._unsafeUnwrapErr()).toMatchObject({
        dataset: 'reseaux-chaleur/sources/fcu-reseaux-chaleur.csv',
        reason: 'malformed_csv',
      })
    })

    it('refuse un identifiant qui obligerait à protéger un champ CSV', () => {
      const result = buildNetworks({ sdesCsv: toSdesCsv('"A,B";01001;10;0.3'), fcuCsv: toFcuCsv() })
      expect(result._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_dataset',
        dataset: 'reseaux-chaleur/sources/sdes-chaleur-commune-2024.csv',
        reason: 'malformed_csv',
        detail: 'field A,B needs CSV quoting',
      })
    })
  })
})
