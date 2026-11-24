import { identity, sortBy } from 'es-toolkit'
import { Result, err, ok } from 'neverthrow'
import { requireColumn } from '../../application/require-column.ts'
import { sum, toBig } from '../../domain/big-number.ts'
import { invalidDataset, type DataRow, type InvalidDataset } from '../../domain/data-source.ts'
import type { SheetRows } from '../sheet-rows.ts'
import { toCsvText } from '../to-csv-text.ts'
import { groupLocalConsumption, type LocalConsumption } from './group-local-consumption.ts'
import { readRegionalEnergy, type RegionalEnergy } from './read-regional-energy.ts'

type NamedSheet = { readonly name: string; readonly rows: SheetRows }

type AgriculturalEnergySources = {
  readonly regionalSheets: readonly NamedSheet[]
  readonly nationalSheet: NamedSheet
  readonly communes: readonly DataRow[]
  readonly irisElectricityCsv: string
  readonly irisGasCsv: string
  readonly epciElectricityCsv: string
  readonly epciGasCsv: string
}

type ControlTotals = Readonly<Record<string, string>>

type SecretLineCounts = {
  readonly irisElectricity: number
  readonly irisGas: number
  readonly epciElectricity: number
  readonly epciGas: number
}

type AgriculturalEnergyBuild = {
  readonly regionsCsv: string
  readonly departementsCsv: string
  readonly epcisCsv: string
  readonly controlTotals: {
    readonly regions: ControlTotals
    readonly departements: ControlTotals
    readonly epcis: ControlTotals
  }
  readonly secretLineCounts: SecretLineCounts
}

type Commune = {
  readonly regionCode: string
  readonly departementCode: string
  readonly epciCode: string
}

type Scope = {
  readonly departements: readonly string[]
  readonly epcis: readonly string[]
  readonly knownDepartements: ReadonlySet<string>
  readonly knownEpcis: ReadonlySet<string>
}

type LocalConsumptions = {
  readonly irisElectricity: LocalConsumption
  readonly irisGas: LocalConsumption
  readonly epciElectricity: LocalConsumption
  readonly epciGas: LocalConsumption
}

type LocalEnergy = {
  readonly code: string
  readonly electricityMwh: string
  readonly naturalGasMwh: string
}

// Source : SDES, classeurs régionaux (colonne 2024, mis à jour le 07 juil. 2026) et extraits locaux IRIS et EPCI de l'année 2024
const DATA_YEAR = '2024'

// Source : écart observé entre la somme des 13 régions et France métropolitaine, 2·10⁻¹¹ GWh au plus (bruit de flottant du tableur), arrondi au-dessus
const REGIONS_SUM_TOLERANCE_GWH = toBig('0.000000001')

// Source : Insee, code officiel géographique : le code d'une commune commence par celui de son département, sur 3 caractères en outre-mer (971 à 976)
const OVERSEAS_DEPARTEMENT_CODE_LENGTH = 3

// Source : Insee, code officiel géographique : le code d'une commune commence par celui de son département, sur 2 caractères en métropole (dont 2A et 2B)
const METROPOLITAN_DEPARTEMENT_CODE_LENGTH = 2

// Source : data/batiments-machines-agricoles/manifest.json, colonnes de regions.csv
const REGIONS_COLUMNS = [
  'code_region',
  'electricity_gwh',
  'natural_gas_gwh',
  'petroleum_products_gwh',
  'heat_gwh',
] as const

// Source : data/batiments-machines-agricoles/manifest.json, colonnes de departements.csv
const DEPARTEMENTS_COLUMNS = ['code_departement', 'electricity_mwh', 'natural_gas_mwh'] as const

// Source : data/batiments-machines-agricoles/manifest.json, colonnes de epcis.csv
const EPCIS_COLUMNS = ['code_epci', 'electricity_mwh', 'natural_gas_mwh'] as const

const regionalDataset = 'sdes-energie-regional'
const communesDataset = 'territoires/communes'
const irisElectricityDataset = 'batiments-machines-agricoles/sources/sdes-electricite-iris-2024-agriculture.csv'
const irisGasDataset = 'batiments-machines-agricoles/sources/sdes-gaz-iris-2024-agriculture.csv'
const epciElectricityDataset = 'batiments-machines-agricoles/sources/sdes-electricite-epci-2024-agriculture.csv'
const epciGasDataset = 'batiments-machines-agricoles/sources/sdes-gaz-epci-2024-agriculture.csv'

function toCommunes(rows: readonly DataRow[]): Result<readonly Commune[], InvalidDataset> {
  const dataset = communesDataset
  return Result.combine(
    rows.map((row) =>
      Result.combine([
        requireColumn({ dataset, row, column: 'code_region' }),
        requireColumn({ dataset, row, column: 'code_departement' }),
        requireColumn({ dataset, row, column: 'code_epci' }),
      ]).map(([regionCode, departementCode, epciCode]) => ({
        regionCode,
        departementCode,
        epciCode,
      })),
    ),
  )
}

function checkRegionsAddUpToNational({
  regions,
  national,
}: {
  regions: readonly RegionalEnergy[]
  national: RegionalEnergy
}): Result<readonly RegionalEnergy[], InvalidDataset> {
  const quantities = [
    'electricityGwh',
    'naturalGasGwh',
    'petroleumProductsGwh',
    'heatGwh',
  ] as const
  const mismatches = quantities.flatMap((quantity) => {
    const regionsTotal = sum(regions.map((region) => toBig(region[quantity])))
    const difference = regionsTotal.minus(toBig(national[quantity]))
    return difference.abs().isGreaterThan(REGIONS_SUM_TOLERANCE_GWH)
      ? [`${quantity}: the regions differ from the national workbook by ${difference.toFixed()}`]
      : []
  })
  const [first] = mismatches
  return first === undefined
    ? ok(regions)
    : err(
        invalidDataset({ dataset: regionalDataset, reason: 'control_total_mismatch', detail: first }),
      )
}

function checkRegionsAreKnown({
  regions,
  communes,
}: {
  regions: readonly RegionalEnergy[]
  communes: readonly Commune[]
}): Result<readonly RegionalEnergy[], InvalidDataset> {
  const known = new Set(communes.map(({ regionCode }) => regionCode))
  const unknown = regions.find(({ regionCode }) => !known.has(regionCode))
  return unknown === undefined
    ? ok(regions)
    : err(
        invalidDataset({
          dataset: regionalDataset,
          reason: 'columns_mismatch',
          detail: `region ${unknown.regionCode} is not in ${communesDataset}`,
        }),
      )
}

function toScope({
  regions,
  communes,
}: {
  regions: readonly RegionalEnergy[]
  communes: readonly Commune[]
}): Scope {
  const covered = new Set(regions.map(({ regionCode }) => regionCode))
  const coveredCommunes = communes.filter(({ regionCode }) => covered.has(regionCode))
  const toEpciCodes = (list: readonly Commune[]): string[] =>
    list.flatMap(({ epciCode }) => (epciCode === '' ? [] : [epciCode]))
  return {
    departements: [...new Set(coveredCommunes.map(({ departementCode }) => departementCode))].toSorted(),
    epcis: [...new Set(toEpciCodes(coveredCommunes))].toSorted(),
    knownDepartements: new Set(communes.map(({ departementCode }) => departementCode)),
    knownEpcis: new Set(toEpciCodes(communes)),
  }
}

function toDepartementCode({
  irisCode,
  departements,
}: {
  irisCode: string
  departements: ReadonlySet<string>
}): string {
  const overseas = irisCode.slice(0, OVERSEAS_DEPARTEMENT_CODE_LENGTH)
  return departements.has(overseas)
    ? overseas
    : irisCode.slice(0, METROPOLITAN_DEPARTEMENT_CODE_LENGTH)
}

function checkKeysAreKnown({
  dataset,
  local,
  known,
}: {
  dataset: string
  local: LocalConsumption
  known: ReadonlySet<string>
}): Result<LocalConsumption, InvalidDataset> {
  const unknown = [...local.consumptionsByKey.keys()].find((key) => !known.has(key))
  return unknown === undefined
    ? ok(local)
    : err(
        invalidDataset({
          dataset,
          reason: 'columns_mismatch',
          detail: `key ${unknown} is not in ${communesDataset}`,
        }),
      )
}

function readLocalConsumptions({
  sources,
  scope,
}: {
  sources: AgriculturalEnergySources
  scope: Scope
}): Result<LocalConsumptions, InvalidDataset> {
  const toDepartementKey = (irisCode: string): string =>
    toDepartementCode({ irisCode, departements: scope.knownDepartements })
  return Result.combine([
    groupLocalConsumption({
      dataset: irisElectricityDataset,
      csv: sources.irisElectricityCsv,
      keyColumn: 'CODE_IRIS_CODE',
      toKey: toDepartementKey,
    }).andThen((local) =>
      checkKeysAreKnown({ dataset: irisElectricityDataset, local, known: scope.knownDepartements }),
    ),
    groupLocalConsumption({
      dataset: irisGasDataset,
      csv: sources.irisGasCsv,
      keyColumn: 'CODE_IRIS_CODE',
      toKey: toDepartementKey,
    }).andThen((local) =>
      checkKeysAreKnown({ dataset: irisGasDataset, local, known: scope.knownDepartements }),
    ),
    groupLocalConsumption({
      dataset: epciElectricityDataset,
      csv: sources.epciElectricityCsv,
      keyColumn: 'CODE_EPCI_CODE',
      toKey: identity,
    }).andThen((local) =>
      checkKeysAreKnown({ dataset: epciElectricityDataset, local, known: scope.knownEpcis }),
    ),
    groupLocalConsumption({
      dataset: epciGasDataset,
      csv: sources.epciGasCsv,
      keyColumn: 'CODE_EPCI_CODE',
      toKey: identity,
    }).andThen((local) =>
      checkKeysAreKnown({ dataset: epciGasDataset, local, known: scope.knownEpcis }),
    ),
  ]).map(([irisElectricity, irisGas, epciElectricity, epciGas]) => ({
    irisElectricity,
    irisGas,
    epciElectricity,
    epciGas,
  }))
}

function sumConsumptionsOf({ local, key }: { local: LocalConsumption; key: string }): string {
  return sum(local.consumptionsByKey.get(key) ?? []).toFixed()
}

function sumTexts(values: readonly string[]): string {
  return sum(values.map((value) => toBig(value))).toFixed()
}

function toLocalEnergies({
  codes,
  electricity,
  naturalGas,
}: {
  codes: readonly string[]
  electricity: LocalConsumption
  naturalGas: LocalConsumption
}): readonly LocalEnergy[] {
  return codes.map((code) => ({
    code,
    electricityMwh: sumConsumptionsOf({ local: electricity, key: code }),
    naturalGasMwh: sumConsumptionsOf({ local: naturalGas, key: code }),
  }))
}

function toLocalRow({ code, electricityMwh, naturalGasMwh }: LocalEnergy): readonly string[] {
  return [code, electricityMwh, naturalGasMwh]
}

function toLocalControlTotals(energies: readonly LocalEnergy[]): ControlTotals {
  return {
    electricity_mwh: sumTexts(energies.map(({ electricityMwh }) => electricityMwh)),
    natural_gas_mwh: sumTexts(energies.map(({ naturalGasMwh }) => naturalGasMwh)),
  }
}

function toRegionRow({
  regionCode,
  electricityGwh,
  naturalGasGwh,
  petroleumProductsGwh,
  heatGwh,
}: RegionalEnergy): readonly string[] {
  return [regionCode, electricityGwh, naturalGasGwh, petroleumProductsGwh, heatGwh]
}

function toRegionsControlTotals(regions: readonly RegionalEnergy[]): ControlTotals {
  return {
    electricity_gwh: sumTexts(regions.map(({ electricityGwh }) => electricityGwh)),
    natural_gas_gwh: sumTexts(regions.map(({ naturalGasGwh }) => naturalGasGwh)),
    petroleum_products_gwh: sumTexts(
      regions.map(({ petroleumProductsGwh }) => petroleumProductsGwh),
    ),
    heat_gwh: sumTexts(regions.map(({ heatGwh }) => heatGwh)),
  }
}

function toBuild({
  regions,
  scope,
  local,
}: {
  regions: readonly RegionalEnergy[]
  scope: Scope
  local: LocalConsumptions
}): Result<AgriculturalEnergyBuild, InvalidDataset> {
  const sortedRegions = sortBy(regions, [({ regionCode }) => regionCode])
  const departementEnergies = toLocalEnergies({
    codes: scope.departements,
    electricity: local.irisElectricity,
    naturalGas: local.irisGas,
  })
  const epciEnergies = toLocalEnergies({
    codes: scope.epcis,
    electricity: local.epciElectricity,
    naturalGas: local.epciGas,
  })
  return Result.combine([
    toCsvText({
      dataset: 'regions',
      columns: REGIONS_COLUMNS,
      rows: sortedRegions.map(toRegionRow),
    }),
    toCsvText({
      dataset: 'departements',
      columns: DEPARTEMENTS_COLUMNS,
      rows: departementEnergies.map(toLocalRow),
    }),
    toCsvText({ dataset: 'epcis', columns: EPCIS_COLUMNS, rows: epciEnergies.map(toLocalRow) }),
  ]).map(([regionsCsv, departementsCsv, epcisCsv]) => ({
    regionsCsv,
    departementsCsv,
    epcisCsv,
    controlTotals: {
      regions: toRegionsControlTotals(sortedRegions),
      departements: toLocalControlTotals(departementEnergies),
      epcis: toLocalControlTotals(epciEnergies),
    },
    secretLineCounts: {
      irisElectricity: local.irisElectricity.secretLineCount,
      irisGas: local.irisGas.secretLineCount,
      epciElectricity: local.epciElectricity.secretLineCount,
      epciGas: local.epciGas.secretLineCount,
    },
  }))
}

function buildAgriculturalEnergy(
  sources: AgriculturalEnergySources,
): Result<AgriculturalEnergyBuild, InvalidDataset> {
  const regionalEnergies = Result.combine(
    sources.regionalSheets.map(({ name, rows }) =>
      readRegionalEnergy({ dataset: name, rows, year: DATA_YEAR }),
    ),
  )
  const nationalEnergy = readRegionalEnergy({
    dataset: sources.nationalSheet.name,
    rows: sources.nationalSheet.rows,
    year: DATA_YEAR,
  })
  return Result.combine([regionalEnergies, nationalEnergy, toCommunes(sources.communes)]).andThen(
    ([regions, national, communes]) =>
      checkRegionsAddUpToNational({ regions, national })
        .andThen(() => checkRegionsAreKnown({ regions, communes }))
        .andThen(() => {
          const scope = toScope({ regions, communes })
          return readLocalConsumptions({ sources, scope }).andThen((local) =>
            toBuild({ regions, scope, local }),
          )
        }),
  )
}

export { buildAgriculturalEnergy }
export type { AgriculturalEnergyBuild, AgriculturalEnergySources, NamedSheet, SecretLineCounts }
