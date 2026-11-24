import { Result, err, ok } from 'neverthrow'
import { invalidDataset, type InvalidDataset } from '../../domain/data-source.ts'
import { roundToLoaderPrecision } from '../round-to-loader-precision.ts'
import type { SheetRows } from '../sheet-rows.ts'

type CerenFuelConsumption = {
  readonly fuelOilTwh: string
  readonly liquefiedPetroleumGasTwh: string
}

const cerenDataset = 'residentiel-sobriete/sources/ceren-donnees-energie-residentiel-1990-2024.xlsx'

// Source : CEREN, Données sur l'énergie dans le résidentiel en France métropolitaine, mise à jour du 20 décembre 2024, tableau « Répartition en 2024 des consommations des résidences principales par usage » : année de la colonne I
const REFERENCE_YEAR = '2024'

// Source : CEREN, même tableau, cellule A56 : intitulé de la ligne d'en-tête qui porte les années
const HEADER_LABEL = 'Énergie'

// Source : CEREN, même tableau, cellule A62 : ligne « Total Fioul », en TWh à climat normal
const FUEL_OIL_LABEL = 'Total Fioul'

// Source : CEREN, même tableau, cellule A70 : ligne « Total GPL », en TWh à climat normal
const LIQUEFIED_PETROLEUM_GAS_LABEL = 'Total GPL'

function toMismatch(detail: string): InvalidDataset {
  return invalidDataset({ dataset: cerenDataset, reason: 'columns_mismatch', detail })
}

function findYearColumn(rows: SheetRows): Result<number, InvalidDataset> {
  const headerRow = rows.find((row) => row[0] === HEADER_LABEL)
  const column = headerRow?.indexOf(REFERENCE_YEAR)
  const isYearColumnMissing = column === undefined || column < 0
  return isYearColumnMissing ? err(toMismatch(`year ${REFERENCE_YEAR}`)) : ok(column)
}

function readTotal({
  rows,
  label,
  yearColumn,
}: {
  rows: SheetRows
  label: string
  yearColumn: number
}): Result<string, InvalidDataset> {
  const totalRow = rows.find((row) => row[0] === label)
  const cell = totalRow?.[yearColumn]
  return typeof cell === 'string'
    ? roundToLoaderPrecision({ dataset: cerenDataset, column: label, text: cell })
    : err(toMismatch(`line ${label}`))
}

function readCerenFuelConsumption(rows: SheetRows): Result<CerenFuelConsumption, InvalidDataset> {
  return findYearColumn(rows).andThen((yearColumn) =>
    Result.combine([
      readTotal({ rows, label: FUEL_OIL_LABEL, yearColumn }),
      readTotal({ rows, label: LIQUEFIED_PETROLEUM_GAS_LABEL, yearColumn }),
    ]).map(([fuelOilTwh, liquefiedPetroleumGasTwh]) => ({ fuelOilTwh, liquefiedPetroleumGasTwh })),
  )
}

export { cerenDataset, readCerenFuelConsumption }
