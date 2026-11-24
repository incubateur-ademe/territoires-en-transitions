import { describe, expect, it } from 'vitest'
import { buildGoodsTransport } from './build-goods-transport.ts'

const TKM_HEADER =
  'region,interne,national_entrant,national_sortant,international_entrant,international_sortant,tkm_rapportees_avec_international,tkm_rapportees_national_seul'
const FLEET_HEADER = 'code_region,carburant,crit_air,parc_poids_lourds_au_1er_janvier_2024'
const OMINEA_HEADER = 'snap,rubric,napfue,polluant,unite,valeur_2024'
const REGION_COLUMNS =
  'code_region,billion_tonne_kilometres,heavy_vehicle_fleet,zero_emission_heavy_vehicle_fleet,diesel_emission_factor_g_per_vehicle_km,diesel_unclassified_share'

const EURO_FACTORS = [
  ['070302PL', 'Euro VI', '600'],
  ['070302PL', 'Euro V', '540'],
  ['070302PL', 'Euro IV', '520'],
  ['070302PL', 'Euro III', '500'],
  ['070303PL', 'Euro VI', '900'],
  ['070303PL', 'Euro V', '800'],
  ['070303PL', 'Euro IV', '760'],
  ['070303PL', 'Euro III', '740'],
] as const

const OMINEA_CSV = [
  OMINEA_HEADER,
  ...EURO_FACTORS.map(([snap, rubric, value]) => `${snap},${rubric},205,CO2,g/(veh.km),${value}`),
].join('\n')

function toTkmCsv(...lines: string[]): string {
  return [TKM_HEADER, ...lines].join('\n')
}

function toFleetCsv(...lines: string[]): string {
  return [FLEET_HEADER, ...lines].join('\n')
}

function tkmLine(region: string, withInternational: string): string {
  return `${region},0,0,0,0,0,${withInternational},0`
}

const BRETAGNE_TKM = tkmLine('Bretagne', '13.5')

function build({
  tonneKilometresCsv = toTkmCsv(BRETAGNE_TKM),
  fleetCsv,
  omineaCsv = OMINEA_CSV,
}: {
  tonneKilometresCsv?: string
  fleetCsv: string
  omineaCsv?: string
}) {
  return buildGoodsTransport({ tonneKilometresCsv, fleetCsv, omineaCsv })
}

const BRETAGNE_FLEET = toFleetCsv(
  "53,Diesel,Crit'Air 2,300",
  "53,Diesel HNR,Crit'Air 3,100",
  "53,Diesel,Crit'Air 5,100",
  "53,Diesel,Non classé,100",
  "53,Electrique,Crit'Air E,10",
  "53,Hydrogène et autre ZE,Crit'Air E,5",
  "53,Essence,Crit'Air 1,5",
)

describe('buildGoodsTransport', () => {
  it('pondère les facteurs Euro des diesel classés par le parc, et compte les parts hors vignette', () => {
    const goods = build({ fleetCsv: BRETAGNE_FLEET })._unsafeUnwrap()
    expect(goods).toEqual({
      csv: `${REGION_COLUMNS}\n53,13.5,620,15,708,0.166666666667\n`,
      regionCount: 1,
      totals: {
        billion_tonne_kilometres: '13.5',
        heavy_vehicle_fleet: '620',
        zero_emission_heavy_vehicle_fleet: '15',
      },
    })
  })

  it('trie les régions par code et les nomme par leur code INSEE', () => {
    const fleetLine = (region: string) => `${region},Diesel,Crit'Air 1,10`
    const goods = build({
      tonneKilometresCsv: toTkmCsv(
        tkmLine('Ile-de-France', '2'),
        tkmLine('Corse', '1'),
        tkmLine("Provence-Alpes-Côte d'Azur", '3'),
      ),
      fleetCsv: toFleetCsv(fleetLine('11'), fleetLine('94'), fleetLine('93')),
    })._unsafeUnwrap()
    expect(goods.csv.split('\n').map((line) => line.split(',')[0])).toEqual([
      'code_region',
      '11',
      '93',
      '94',
      '',
    ])
  })

  it('ne compte que les poids lourds de la région', () => {
    const goods = build({
      fleetCsv: toFleetCsv("53,Diesel,Crit'Air 2,10", "11,Diesel,Crit'Air 2,1000"),
    })._unsafeUnwrap()
    expect(goods.totals['heavy_vehicle_fleet']).toBe('10')
  })

  it('refuse une région sans poids lourd diesel classé', () => {
    expect(
      build({ fleetCsv: toFleetCsv("53,Diesel,Non classé,10", "53,Essence,Crit'Air 1,10") })._unsafeUnwrapErr(),
    ).toEqual({
      kind: 'invalid_dataset',
      dataset: 'transport-marchandises/sources/sdes-parc-poids-lourds-2024-par-region.csv',
      reason: 'missing_key_column',
      detail: '53',
    })
  })

  it('refuse une région absente du parc', () => {
    expect(build({ fleetCsv: toFleetCsv("11,Diesel,Crit'Air 1,10") })._unsafeUnwrapErr()).toMatchObject({
      reason: 'missing_key_column',
      detail: '53',
    })
  })

  it('refuse une région de tonnes.kilomètres inconnue', () => {
    expect(
      build({
        tonneKilometresCsv: toTkmCsv(tkmLine('Atlantide', '1')),
        fleetCsv: BRETAGNE_FLEET,
      })._unsafeUnwrapErr(),
    ).toEqual({
      kind: 'invalid_dataset',
      dataset: 'transport-marchandises/sources/sdes-trm-tkm-par-region-et-type-de-flux-2024.csv',
      reason: 'missing_key_column',
      detail: 'Atlantide',
    })
  })

  it('refuse des tonnes.kilomètres qui ne sont pas un nombre', () => {
    expect(
      build({
        tonneKilometresCsv: toTkmCsv(tkmLine('Bretagne', 'beaucoup')),
        fleetCsv: BRETAGNE_FLEET,
      })._unsafeUnwrapErr(),
    ).toMatchObject({ reason: 'unreadable' })
  })

  it('refuse un parc qui n’est pas un nombre', () => {
    expect(
      build({ fleetCsv: toFleetCsv("53,Diesel,Crit'Air 2,beaucoup") })._unsafeUnwrapErr(),
    ).toMatchObject({
      dataset: 'transport-marchandises/sources/sdes-parc-poids-lourds-2024-par-region.csv',
      reason: 'unreadable',
      detail: 'parc_poids_lourds_au_1er_janvier_2024=beaucoup is not a decimal number',
    })
  })

  it('refuse un relevé OMINEA sans le facteur d’une norme Euro', () => {
    expect(
      build({
        fleetCsv: BRETAGNE_FLEET,
        omineaCsv: [OMINEA_HEADER, '070302PL,Euro VI,205,CO2,g/(veh.km),600'].join('\n'),
      })._unsafeUnwrapErr(),
    ).toMatchObject({
      dataset: 'transport-marchandises/sources/ominea-co2-poids-lourds-diesel-g-par-vehicule-km-2024.csv',
      reason: 'missing_key_column',
    })
  })

  it('refuse un facteur OMINEA qui n’est pas un nombre', () => {
    const omineaCsv = [
      OMINEA_HEADER,
      ...EURO_FACTORS.map(([snap, rubric]) => `${snap},${rubric},205,CO2,g/(veh.km),beaucoup`),
    ].join('\n')
    expect(build({ fleetCsv: BRETAGNE_FLEET, omineaCsv })._unsafeUnwrapErr()).toMatchObject({
      reason: 'unreadable',
      detail: 'valeur_2024=beaucoup is not a decimal number',
    })
  })

  it('refuse un relevé OMINEA sans colonne de valeur', () => {
    expect(
      build({
        fleetCsv: BRETAGNE_FLEET,
        omineaCsv: 'snap,rubric\n070302PL,Euro VI',
      })._unsafeUnwrapErr(),
    ).toMatchObject({ reason: 'columns_mismatch', detail: 'valeur_2024' })
  })

  it.each([
    ['tonnes.kilomètres', { tonneKilometresCsv: 'a,b\n1,2,3' }],
    ['parc', { fleetCsv: 'a,b\n1,2,3' }],
    ['OMINEA', { omineaCsv: 'a,b\n1,2,3' }],
  ])('refuse un relevé de %s mal formé', (_label, override) => {
    expect(build({ fleetCsv: BRETAGNE_FLEET, ...override })._unsafeUnwrapErr()).toMatchObject({
      reason: 'malformed_csv',
    })
  })
})
