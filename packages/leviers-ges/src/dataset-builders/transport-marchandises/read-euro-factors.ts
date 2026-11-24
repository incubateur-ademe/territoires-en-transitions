import type BigNumber from 'bignumber.js'
import { Result, err } from 'neverthrow'
import { requireColumn } from '../../application/require-column.ts'
import { parseBig, sum, toBig } from '../../domain/big-number.ts'
import { invalidDataset, type DataRow, type InvalidDataset } from '../../domain/data-source.ts'
import { parseCsvText } from '../../infrastructure/csv/parse-csv-text.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'

const omineaDataset = 'transport-marchandises/sources/ominea-co2-poids-lourds-diesel-g-par-vehicule-km-2024.csv'

// Source : tableur PlanET V1, FE_transports!G42:K75 : norme Euro des poids lourds diesel pour chaque vignette Crit'Air (Crit'Air E, non classé et inconnu n'en ont pas)
const EURO_STANDARD_BY_CRIT_AIR: ReadonlyMap<string, string> = new Map([
  ["Crit'Air 1", 'Euro VI'],
  ["Crit'Air 2", 'Euro VI'],
  ["Crit'Air 3", 'Euro V'],
  ["Crit'Air 4", 'Euro IV'],
  ["Crit'Air 5", 'Euro III'],
])

// Source : tableur PlanET V1, FE_transports!A22 et A31 : le domicile-travail est le type de mobilité par défaut, avec 50 % du facteur SNAP « route » (070302PL) et 50 % de « ville » (070303PL), comme les autres courtes distances ; hypothèse nommée heavyVehicleTripType
const ROAD_AND_CITY_SNAP_WEIGHTS: ReadonlyMap<string, BigNumber> = new Map([
  ['070302PL', toBig('0.5')],
  ['070303PL', toBig('0.5')],
])

function findFactor({
  rows,
  snapCode,
  euroStandard,
}: {
  rows: readonly DataRow[]
  snapCode: string
  euroStandard: string
}): Result<BigNumber, InvalidDataset> {
  const dataset = omineaDataset
  const row = rows.find((candidate) => candidate['snap'] === snapCode && candidate['rubric'] === euroStandard)
  if (row === undefined) {
    return err(
      invalidDataset({ dataset, reason: 'missing_key_column', detail: `${snapCode} ${euroStandard}` }),
    )
  }
  return requireColumn({ dataset, row, column: 'valeur_2024' }).andThen((text) =>
    parseBig(text).mapErr(() =>
      invalidDataset({
        dataset,
        reason: 'unreadable',
        detail: `valeur_2024=${text} is not a decimal number`,
      }),
    ),
  )
}

function calculateRoadAndCityFactor({
  rows,
  euroStandard,
}: {
  rows: readonly DataRow[]
  euroStandard: string
}): Result<BigNumber, InvalidDataset> {
  const weightedFactors = [...ROAD_AND_CITY_SNAP_WEIGHTS].map(([snapCode, weight]) =>
    findFactor({ rows, snapCode, euroStandard }).map((factor) => factor.times(weight)),
  )
  return Result.combine(weightedFactors).map(sum)
}

function readEuroFactors(
  omineaCsv: string,
): Result<ReadonlyMap<string, BigNumber>, InvalidDataset> {
  return parseCsvText({ text: omineaCsv, delimiter: ',' })
    .mapErr(toInvalidDataset(omineaDataset))
    .andThen((rows) =>
      Result.combine(
        [...EURO_STANDARD_BY_CRIT_AIR].map(([critAir, euroStandard]) =>
          calculateRoadAndCityFactor({ rows, euroStandard }).map(
            (factor): readonly [string, BigNumber] => [critAir, factor],
          ),
        ),
      ),
    )
    .map((entries) => new Map(entries))
}

export { readEuroFactors }
