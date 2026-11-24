import { describe, expect, it } from 'vitest'
import { buildHeatNetworks } from './build-heat-networks.ts'

const SDES_HEADER = 'ID;COMMUNE_CODE;CONSOR;CONTENU_EN_CO2'
const NETWORKS_HEADER =
  'network_id,commune_code,delivered_mwh,emission_factor_kg_per_kwh'

function toSdesCsv(...lines: string[]): string {
  return [SDES_HEADER, ...lines].join('\n')
}

function toNetworksCsv(...lines: string[]): string {
  return `${[NETWORKS_HEADER, ...lines].join('\n')}\n`
}

describe('buildHeatNetworks', () => {
  it('trie par identifiant et garde les livraisons au résidentiel et le contenu CO2 du SDES', () => {
    const build = buildHeatNetworks(toSdesCsv('B;01001;200;0.5', 'A;01002;100;0.25'))._unsafeUnwrap()
    expect(build).toEqual({
      csv: toNetworksCsv('A,01002,100,0.25', 'B,01001,200,0.5'),
      networkCount: 2,
      secretNetworkCount: 0,
      totalResidentialDeliveredMwh: '300',
    })
  })

  it('écarte les réseaux sous secret statistique et les compte', () => {
    const build = buildHeatNetworks(toSdesCsv('A;01001;secret;secret', 'B;01002;40;0.2'))._unsafeUnwrap()
    expect(build).toEqual({
      csv: toNetworksCsv('B,01002,40,0.2'),
      networkCount: 1,
      secretNetworkCount: 1,
      totalResidentialDeliveredMwh: '40',
    })
  })

  it('garde un réseau sans livraison au résidentiel, à zéro', () => {
    const build = buildHeatNetworks(toSdesCsv('A;01001;0;0.3'))._unsafeUnwrap()
    expect(build.csv).toBe(toNetworksCsv('A,01001,0,0.3'))
  })

  it('rattache l’arrondissement d’une commune à sa commune', () => {
    const build = buildHeatNetworks(toSdesCsv('A;75101;10;0.3'))._unsafeUnwrap()
    expect(build.csv).toBe(toNetworksCsv('A,75056,10,0.3'))
  })

  it.each([
    ['1.0000000000005', '1.000000000001'],
    ['1.0000000000004', '1'],
    ['12', '12'],
  ])('arrondit la livraison %s à 12 décimales, soit %s', (delivered, expected) => {
    const build = buildHeatNetworks(toSdesCsv(`A;01001;${delivered};0.3`))._unsafeUnwrap()
    expect(build.csv).toBe(toNetworksCsv(`A,01001,${expected},0.3`))
  })

  it('arrondit le contenu CO2 à 12 décimales', () => {
    const build = buildHeatNetworks(toSdesCsv('A;01001;10;0.0000000000005'))._unsafeUnwrap()
    expect(build.csv).toBe(toNetworksCsv('A,01001,10,0.000000000001'))
  })

  it('refuse une livraison qui n’est pas un nombre', () => {
    expect(buildHeatNetworks(toSdesCsv('A;01001;n.d.;0.3'))._unsafeUnwrapErr()).toMatchObject({
      kind: 'invalid_dataset',
      reason: 'unreadable',
      detail: 'CONSOR=n.d. is not a decimal number',
    })
  })

  it('refuse un fichier sans colonne CONSOR', () => {
    expect(buildHeatNetworks('ID;COMMUNE_CODE;CONTENU_EN_CO2\nA;01001;0.3')._unsafeUnwrapErr()).toMatchObject({
      reason: 'columns_mismatch',
      detail: 'CONSOR',
    })
  })

  it('refuse un identifiant qui demanderait des guillemets dans le CSV produit', () => {
    expect(buildHeatNetworks(toSdesCsv('"A,1";01001;10;0.3'))._unsafeUnwrapErr()).toMatchObject({
      reason: 'malformed_csv',
    })
  })

  it('refuse un CSV mal formé', () => {
    expect(buildHeatNetworks('a;a\n1;2')._unsafeUnwrapErr()).toMatchObject({
      reason: 'malformed_csv',
    })
  })
})
