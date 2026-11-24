import { sortBy } from 'es-toolkit'
import { Result, ok } from 'neverthrow'
import { requireColumn } from '../../application/require-column.ts'
import { sum, toBig } from '../../domain/big-number.ts'
import type { DataRow, InvalidDataset } from '../../domain/data-source.ts'
import { parseCsvText } from '../../infrastructure/csv/parse-csv-text.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'
import { roundToLoaderPrecision } from '../round-to-loader-precision.ts'
import { toCsvText } from '../to-csv-text.ts'
import { departementsDataset, epcisDataset, type OrganicSources } from './read-organic-sources.ts'

type OrganicBuild = {
  readonly epciDepartementsCsv: string
  readonly departementsCsv: string
  readonly epciDepartementCount: number
  readonly departementCount: number
  readonly maskedEpciDepartementCount: number
  readonly epciDepartementsHectares: string
  readonly departementsHectares: string
}

type OrganicArea = {
  readonly epci: string
  readonly departement: string
  readonly hectares: string | undefined
}

const outputDataset = 'fertilisation-azotee'

// Source : data/fertilisation-azotee/manifest.json, colonnes de organic-epci-departements.csv
const EPCI_DEPARTEMENTS_COLUMNS = [
  'epci_departement',
  'code_epci',
  'code_departement',
  'organic_hectares',
] as const

// Source : data/fertilisation-azotee/manifest.json, colonnes de organic-departements.csv
const DEPARTEMENTS_COLUMNS = ['code_departement', 'organic_hectares'] as const

// Source : Agence Bio, jeu « surfaces, cheptels et opérateurs par EPCI » : les EPCI ont un code SIREN à 9 chiffres commençant par 2 ; « NA », « ZZZZZZZZZ » (sans objet) et 992367730 n'en sont pas
const EPCI_CODE = /^2\d{8}$/

// Source : codes INSEE des départements de France métropolitaine, Corse comprise (2A, 2B) ; les DROM (971 à 978) sont hors périmètre
const METROPOLITAN_DEPARTEMENT_CODE = /^(?:\d{2}|2[AB])$/

// Source : Agence Bio, jeu « surfaces, cheptels et opérateurs » : « NC » signale le secret statistique (1 ou 2 exploitations)
const MASKED_VALUE = 'NC'

function toHectares({
  dataset,
  surfbio,
}: {
  dataset: string
  surfbio: string
}): Result<string | undefined, InvalidDataset> {
  if (surfbio === MASKED_VALUE) return ok(undefined)
  return roundToLoaderPrecision({ dataset, column: 'surfbio', text: surfbio })
}

function toOrganicRow({
  dataset,
  row,
  epciColumn,
}: {
  dataset: string
  row: DataRow
  epciColumn: string | undefined
}): Result<OrganicArea, InvalidDataset> {
  return Result.combine([
    epciColumn === undefined
      ? ok('')
      : requireColumn({ dataset, row, column: epciColumn }),
    requireColumn({ dataset, row, column: 'codedepartement' }),
    requireColumn({ dataset, row, column: 'surfbio' }),
  ]).andThen(([epci, departement, surfbio]) =>
    toHectares({ dataset, surfbio }).map((hectares) => ({ epci, departement, hectares })),
  )
}

function readOrganicAreas({
  dataset,
  csv,
  epciColumn,
}: {
  dataset: string
  csv: string
  epciColumn: string | undefined
}): Result<readonly OrganicArea[], InvalidDataset> {
  return parseCsvText({ text: csv, delimiter: ',' })
    .mapErr(toInvalidDataset(dataset))
    .andThen((rows) =>
      Result.combine(rows.map((row) => toOrganicRow({ dataset, row, epciColumn }))),
    )
    .map((areas) =>
      areas.filter(({ departement }) => METROPOLITAN_DEPARTEMENT_CODE.test(departement)),
    )
}

function totalHectares(areas: readonly { readonly hectares: string }[]): string {
  return sum(areas.map(({ hectares }) => toBig(hectares))).toFixed()
}

function keepUnmasked(areas: readonly OrganicArea[]) {
  return areas.flatMap(({ epci, departement, hectares }) =>
    hectares === undefined ? [] : [{ epci, departement, hectares }],
  )
}

function toOrganicBuild({
  epciAreas,
  departementAreas,
}: {
  epciAreas: readonly OrganicArea[]
  departementAreas: readonly OrganicArea[]
}): Result<OrganicBuild, InvalidDataset> {
  const dataset = outputDataset
  const epcis = epciAreas.filter(({ epci }) => EPCI_CODE.test(epci))
  const unmasked = keepUnmasked(epcis)
  const unmaskedDepartements = keepUnmasked(departementAreas)
  const epciRows = sortBy(unmasked, [({ epci }) => epci, ({ departement }) => departement]).map(
    ({ epci, departement, hectares }) => [`${epci}-${departement}`, epci, departement, hectares],
  )
  const departementRows = sortBy(unmaskedDepartements, [({ departement }) => departement]).map(
    ({ departement, hectares }) => [departement, hectares],
  )
  return Result.combine([
    toCsvText({ dataset, columns: EPCI_DEPARTEMENTS_COLUMNS, rows: epciRows }),
    toCsvText({ dataset, columns: DEPARTEMENTS_COLUMNS, rows: departementRows }),
  ]).map(([epciDepartementsCsv, departementsCsv]) => ({
    epciDepartementsCsv,
    departementsCsv,
    epciDepartementCount: epciRows.length,
    departementCount: departementRows.length,
    maskedEpciDepartementCount: epcis.filter(({ hectares }) => hectares === undefined).length,
    epciDepartementsHectares: totalHectares(unmasked),
    departementsHectares: totalHectares(unmaskedDepartements),
  }))
}

function buildOrganicAreas({
  epciOrganicCsv,
  departementOrganicCsv,
}: OrganicSources): Result<OrganicBuild, InvalidDataset> {
  return Result.combine([
    readOrganicAreas({ dataset: epcisDataset, csv: epciOrganicCsv, epciColumn: 'codeepci' }),
    readOrganicAreas({
      dataset: departementsDataset,
      csv: departementOrganicCsv,
      epciColumn: undefined,
    }),
  ]).andThen(([epciAreas, departementAreas]) => toOrganicBuild({ epciAreas, departementAreas }))
}

export { buildOrganicAreas }
export type { OrganicBuild }
