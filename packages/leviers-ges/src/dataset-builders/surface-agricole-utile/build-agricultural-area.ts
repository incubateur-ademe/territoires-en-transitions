import type BigNumber from 'bignumber.js'
import { sortBy } from 'es-toolkit'
import { Result, err, ok } from 'neverthrow'
import { requireColumn } from '../../application/require-column.ts'
import { sum, toBig } from '../../domain/big-number.ts'
import { invalidDataset, type DataRow, type InvalidDataset } from '../../domain/data-source.ts'
import { parseCsvText } from '../../infrastructure/csv/parse-csv-text.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'
import { roundToLoaderPrecision } from '../round-to-loader-precision.ts'
import { toCsvText } from '../to-csv-text.ts'

type AgriculturalAreaSources = {
  readonly communeCsv: string
  readonly regionCsv: string
  readonly departementCsv: string
  readonly communes: readonly DataRow[]
}

type AgriculturalAreaBuild = {
  readonly csv: string
  readonly communeCount: number
  readonly recodedCommuneCount: number
  readonly totalHectares: string
}

type CensusLine = { readonly key: string; readonly hectares: BigNumber }

type Area = { readonly regionCode: string; readonly departementCode: string }

type HectaresByKey = ReadonlyMap<string, BigNumber>

type LocatedCommune = { readonly code: string; readonly hectares: BigNumber; readonly area: Area }

// Source : Agreste, recensement agricole 2020 (le fichier source contient aussi 2010) ; la date de mesure commence par l'année
const CENSUS_DATE_PREFIX = '2020-'

// Source : écart observé entre la somme des communes et les fichiers régional et départemental, 7·10⁻⁹ ha au plus, arrondi au-dessus
const AREA_SUM_TOLERANCE_HECTARES = toBig('0.000001')

// Source : geo.api.gouv.fr, champ anciensCodes de la commune actuelle, relevé le 2026-10-08 : 12076 Conques-en-Rouergue → 12218, 14011 Aurseulles → 14581, 49069 Orée d'Anjou → 49126, 69159 Porte des Pierres Dorées → 69114 (changement de code) et 49321 Saint-Sigismond → 49160 Ingrandes-le-Fresne-sur-Loire (commune déléguée depuis le 2024-01-01)
const COMMUNE_CODE_CHANGES: ReadonlyMap<string, string> = new Map([
  ['12076', '12218'],
  ['14011', '14581'],
  ['49069', '49126'],
  ['49321', '49160'],
  ['69159', '69114'],
])

// Source : data/surface-agricole-utile/manifest.json, colonnes de communes.csv
const COMMUNES_COLUMNS = ['code_commune', 'agricultural_area_ha'] as const

const communeDataset = 'surface-agricole-utile/sources/sau-commune.csv'
const regionDataset = 'surface-agricole-utile/sources/sau-region.csv'
const departementDataset = 'surface-agricole-utile/sources/sau-departement.csv'
const geographyDataset = 'territoires/communes'

function readCensusLines({
  dataset,
  csv,
  keyColumn,
}: {
  dataset: string
  csv: string
  keyColumn: string
}): Result<readonly CensusLine[], InvalidDataset> {
  return parseCsvText({ text: csv, delimiter: ',' })
    .mapErr(toInvalidDataset(dataset))
    .andThen((rows) =>
      Result.combine(
        rows.map((row) =>
          Result.combine([
            requireColumn({ dataset, row, column: 'date_mesure' }),
            requireColumn({ dataset, row, column: keyColumn }),
            requireColumn({ dataset, row, column: 'valeur' }),
          ]),
        ),
      ),
    )
    .map((lines) => lines.filter(([date]) => date.startsWith(CENSUS_DATE_PREFIX)))
    .andThen((lines) =>
      lines.length === 0
        ? err(
            invalidDataset({
              dataset,
              reason: 'empty_dataset',
              detail: `no line dated ${CENSUS_DATE_PREFIX}`,
            }),
          )
        : ok(lines),
    )
    .andThen((lines) =>
      Result.combine(
        lines.map(([, key, value]) =>
          roundToLoaderPrecision({ dataset, column: 'valeur', text: value }).map((hectares) => ({
            key,
            hectares: toBig(hectares),
          })),
        ),
      ),
    )
}

function toAreas(rows: readonly DataRow[]): Result<ReadonlyMap<string, Area>, InvalidDataset> {
  const dataset = geographyDataset
  return Result.combine(
    rows.map((row) =>
      Result.combine([
        requireColumn({ dataset, row, column: 'code_commune' }),
        requireColumn({ dataset, row, column: 'code_region' }),
        requireColumn({ dataset, row, column: 'code_departement' }),
      ]).map(([code, regionCode, departementCode]) => [code, { regionCode, departementCode }] as const),
    ),
  ).map((entries) => new Map(entries))
}

function toCurrentCode(code: string): string {
  return COMMUNE_CODE_CHANGES.get(code) ?? code
}

function sumHectaresByKey(lines: readonly CensusLine[]): HectaresByKey {
  const groups = Map.groupBy(lines, ({ key }) => key)
  return new Map(
    [...groups].map(([key, group]) => [key, sum(group.map(({ hectares }) => hectares))]),
  )
}

function locateCommunes({
  hectaresByCommune,
  areas,
}: {
  hectaresByCommune: HectaresByKey
  areas: ReadonlyMap<string, Area>
}): Result<readonly LocatedCommune[], InvalidDataset> {
  return Result.combine(
    [...hectaresByCommune].map(([code, hectares]) => {
      const area = areas.get(code)
      return area === undefined
        ? err(
            invalidDataset({
              dataset: communeDataset,
              reason: 'columns_mismatch',
              detail: `commune ${code} is not in ${geographyDataset}`,
            }),
          )
        : ok({ code, hectares, area })
    }),
  )
}

function checkCommunesAddUpTo({
  dataset,
  reference,
  communes,
  keyOf,
}: {
  dataset: string
  reference: readonly CensusLine[]
  communes: readonly LocatedCommune[]
  keyOf: (area: Area) => string
}): Result<readonly LocatedCommune[], InvalidDataset> {
  const referenceTotals = sumHectaresByKey(reference)
  const communeTotals = sumHectaresByKey(
    communes.map(({ hectares, area }) => ({ key: keyOf(area), hectares })),
  )
  const keys = new Set([...referenceTotals.keys(), ...communeTotals.keys()])
  const mismatches = [...keys].flatMap((key) => {
    const expected = referenceTotals.get(key) ?? sum([])
    const actual = communeTotals.get(key) ?? sum([])
    const difference = actual.minus(expected)
    return difference.abs().isGreaterThan(AREA_SUM_TOLERANCE_HECTARES)
      ? [`${key}: the communes differ from the file by ${difference.toFixed()}`]
      : []
  })
  const [first] = mismatches
  return first === undefined
    ? ok(communes)
    : err(invalidDataset({ dataset, reason: 'control_total_mismatch', detail: first }))
}

function countRecodedCommunes(communeLines: readonly CensusLine[]): number {
  return communeLines.filter(({ key }) => COMMUNE_CODE_CHANGES.has(key)).length
}

function toCommunesCsv(communes: readonly LocatedCommune[]): Result<string, InvalidDataset> {
  return toCsvText({
    dataset: communeDataset,
    columns: COMMUNES_COLUMNS,
    rows: sortBy(communes, [({ code }) => code]).map(({ code, hectares }) => [
      code,
      hectares.toFixed(),
    ]),
  })
}

function buildAgriculturalArea(
  sources: AgriculturalAreaSources,
): Result<AgriculturalAreaBuild, InvalidDataset> {
  return Result.combine([
    readCensusLines({ dataset: communeDataset, csv: sources.communeCsv, keyColumn: 'geocode_commune' }),
    readCensusLines({ dataset: regionDataset, csv: sources.regionCsv, keyColumn: 'geocode_region' }),
    readCensusLines({
      dataset: departementDataset,
      csv: sources.departementCsv,
      keyColumn: 'geocode_departement',
    }),
    toAreas(sources.communes),
  ]).andThen(([communeLines, regionLines, departementLines, areas]) => {
    const currentLines = communeLines.map(({ key, hectares }) => ({
      key: toCurrentCode(key),
      hectares,
    }))
    const hectaresByCommune = sumHectaresByKey(currentLines)
    return locateCommunes({ hectaresByCommune, areas })
      .andThen((communes) =>
        checkCommunesAddUpTo({
          dataset: regionDataset,
          reference: regionLines,
          communes,
          keyOf: ({ regionCode }) => regionCode,
        }),
      )
      .andThen((communes) =>
        checkCommunesAddUpTo({
          dataset: departementDataset,
          reference: departementLines,
          communes,
          keyOf: ({ departementCode }) => departementCode,
        }),
      )
      .andThen((communes) =>
        toCommunesCsv(communes).map((csv) => ({
          csv,
          communeCount: communes.length,
          recodedCommuneCount: countRecodedCommunes(communeLines),
          totalHectares: sum(communes.map(({ hectares }) => hectares)).toFixed(),
        })),
      )
  })
}

export { buildAgriculturalArea, COMMUNE_CODE_CHANGES }
export type { AgriculturalAreaBuild, AgriculturalAreaSources }
