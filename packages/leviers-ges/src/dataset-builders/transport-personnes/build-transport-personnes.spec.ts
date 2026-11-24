import { describe, expect, it } from 'vitest'
import { buildTransportPersonnes } from './build-transport-personnes.ts'
import { fleetDataset } from './read-fleet.ts'

const COMMUTING_HEADER =
  'side,level,code,mode,champ_co2,sum_ipondi,sum_ipondi_dist_hebdo,sum_ipondi_co2_hebdo,rows'

const FLEET_HEADER = 'maille,code,groupe,carburant,parc_2025'

function commuting(...lines: readonly string[]): string {
  return `${[COMMUTING_HEADER, ...lines].join('\n')}\n`
}

function fleet(...lines: readonly string[]): string {
  return `${[FLEET_HEADER, ...lines].join('\n')}\n`
}

function commutingOf(level: string, code: string): readonly string[] {
  return [
    `R,${level},${code},5,TRUE,1,100,0,1`,
    `T,${level},${code},5,TRUE,1,60,0,1`,
    `R,${level},${code},6,TRUE,1,20,0,1`,
    `R,${level},${code},2,TRUE,1,5000,0,1`,
  ]
}

function fleetOf(level: string, code: string): readonly string[] {
  return [
    `${level},${code},VP,diesel,2`,
    `${level},${code},VP,autre,2`,
    `${level},${code},TC_routier,diesel,1`,
    `${level},${code},TC_routier,essence,1`,
  ]
}

function mixedFleetOf(level: string, code: string): readonly string[] {
  return [
    `${level},${code},VP,diesel,2`,
    `${level},${code},VP,electrique,2`,
    `${level},${code},VP,essence,4`,
    `${level},${code},TC_routier,diesel,1`,
    `${level},${code},TC_routier,gaz,1`,
    `${level},${code},TC_routier,electrique,2`,
  ]
}

const COMMUTING_CSV = commuting(
  ...commutingOf('REG', '84'),
  ...commutingOf('REG', '99'),
  ...commutingOf('DEP', '01'),
  ...commutingOf('DEP', '02'),
  ...commutingOf('EPCI', '200000001'),
  ...commutingOf('EPCI', '999999999'),
  ...commutingOf('EPCI', 'ZZZZZZZZZ'),
)

const FLEET_CSV = fleet(
  ...fleetOf('REG', '84'),
  ...fleetOf('DEP', '01'),
  ...mixedFleetOf('DEP', '02'),
)

const HEADER_TAIL =
  'car_weekly_passenger_km,public_transport_weekly_passenger_km,car_emission_factor_kg_per_km,bus_emission_factor_kg_per_km,car_fleet_unclassified_share,bus_fleet_unclassified_share,car_fleet_classified,bus_fleet_classified,car_thermal_emission_factor_kg_per_km,bus_thermal_emission_factor_kg_per_km,car_thermal_fleet_share,bus_thermal_fleet_share'

describe('buildTransportPersonnes', () => {
  const built = buildTransportPersonnes({ commutingCsv: COMMUTING_CSV, fleetCsv: FLEET_CSV })._unsafeUnwrap()

  it('écrit une ligne par région avec ses passagers.km, ses facteurs et ses parts exclues', () => {
    expect(built.regions.csv).toBe(`code_region,${HEADER_TAIL}\n84,80,10,0.1636,0.8045,0.5,0.5,2,1,0.1636,0.8045,0.5,0.5\n`)
  })

  it('écrit une ligne par département', () => {
    expect(built.departements.csv).toBe(
      `code_departement,${HEADER_TAIL}\n01,80,10,0.1636,0.8045,0.5,0.5,2,1,0.1636,0.8045,0.5,0.5\n02,80,10,0.12978625,0.426075,0,0,8,4,0.1686,0.75715,0.75,0.5\n`,
    )
  })

  it('écrit le facteur du parc thermique seul, distinct du facteur du parc entier quand le parc compte de l’électrique', () => {
    const row = built.departements.csv.split('\n')[2]?.split(',')
    expect({
      carEmissionFactor: row?.[3],
      carThermalEmissionFactor: row?.[9],
      busEmissionFactor: row?.[4],
      busThermalEmissionFactor: row?.[10],
    }).toEqual({
      carEmissionFactor: '0.12978625',
      carThermalEmissionFactor: '0.1686',
      busEmissionFactor: '0.426075',
      busThermalEmissionFactor: '0.75715',
    })
  })

  it('donne à un EPCI sans parc les facteurs nationaux et aucun véhicule classé', () => {
    expect(built.epcis.csv).toBe(`code_epci,${HEADER_TAIL}\n200000001,80,10,0.1636,0.8045,0,0,0,0,0.1636,0.8045,0,0\n`)
  })

  it('compte les territoires de chaque niveau, les codes hors champ de la source exclus', () => {
    expect([built.regions, built.departements, built.epcis].map(({ territoryCount }) => territoryCount)).toEqual([
      1, 2, 1,
    ])
  })

  it('donne les totaux de contrôle des passagers.km par semaine', () => {
    expect(built.regions.controlTotals).toEqual({
      car_weekly_passenger_km: '80',
      public_transport_weekly_passenger_km: '10',
    })
  })

  it('refuse un parc national sans voiture classée : la moyenne nationale manquerait', () => {
    expect(
      buildTransportPersonnes({
        commutingCsv: COMMUTING_CSV,
        fleetCsv: fleet('REG,84,VP,autre,2', 'REG,84,TC_routier,diesel,1'),
      })._unsafeUnwrapErr(),
    ).toEqual({
      kind: 'invalid_dataset',
      dataset: fleetDataset,
      reason: 'empty_dataset',
      detail: 'national VP fleet',
    })
  })

  it('refuse un parc national sans bus classé', () => {
    expect(
      buildTransportPersonnes({
        commutingCsv: COMMUTING_CSV,
        fleetCsv: fleet('REG,84,VP,diesel,2', 'REG,84,TC_routier,essence,1'),
      })._unsafeUnwrapErr(),
    ).toMatchObject({
      dataset: fleetDataset,
      reason: 'empty_dataset',
      detail: 'national TC_routier fleet',
    })
  })

  it('nomme le fichier de sortie dans une erreur d’écriture', () => {
    expect(
      buildTransportPersonnes({
        commutingCsv: commuting('R,DEP,"0,1",5,TRUE,1,100,0,1'),
        fleetCsv: FLEET_CSV,
      })._unsafeUnwrapErr(),
    ).toMatchObject({
      dataset: 'transport-personnes/departements.csv',
      reason: 'malformed_csv',
    })
  })

  it('refuse un trajet domicile-travail illisible', () => {
    expect(
      buildTransportPersonnes({
        commutingCsv: commuting('R,REG,84,5,TRUE,1,abc,0,1'),
        fleetCsv: FLEET_CSV,
      })._unsafeUnwrapErr(),
    ).toMatchObject({ kind: 'invalid_dataset', reason: 'unreadable' })
  })

  it('refuse un parc mal formé', () => {
    expect(
      buildTransportPersonnes({ commutingCsv: COMMUTING_CSV, fleetCsv: 'a,a\n1,2\n' })._unsafeUnwrapErr(),
    ).toMatchObject({ reason: 'malformed_csv' })
  })

  it('refuse un trajet dont le nom de colonne manque', () => {
    expect(
      buildTransportPersonnes({ commutingCsv: 'side\nR\n', fleetCsv: FLEET_CSV })._unsafeUnwrapErr(),
    ).toMatchObject({ reason: 'columns_mismatch' })
  })
})
