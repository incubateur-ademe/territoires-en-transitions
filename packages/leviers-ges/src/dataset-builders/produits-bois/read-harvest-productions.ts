import { Result, err, ok } from 'neverthrow'
import { requireColumn } from '../../application/require-column.ts'
import { invalidDataset, type DataRow, type InvalidDataset } from '../../domain/data-source.ts'
import { parseCsvText } from '../../infrastructure/csv/parse-csv-text.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'
import { roundToLoaderPrecision } from '../round-to-loader-precision.ts'
import { WOOD_REFERENCE_YEAR } from './wood-reference-year.ts'

type Production = {
  readonly logsThousandM3: string
  readonly industrialWoodThousandM3: string
}

type Geography =
  | { readonly kind: 'national' }
  | { readonly kind: 'region'; readonly code: string }
  | { readonly kind: 'departement'; readonly code: string }

type LocatedProduction = { readonly geography: Geography; readonly production: Production }

type HarvestEntry = {
  readonly geography: string
  readonly modalityCode: string
  readonly thousandM3: string
}

type ModalitySelection = {
  readonly geography: string
  readonly entries: readonly HarvestEntry[]
}

const harvestDataset = 'produits-bois/sources/agreste-exfnr00-recolte-bois-2018-2022.csv'

// Source : Agreste, tableau EXFNR00, colonne code_modalite : 1.11 = « Grumes » (bois d'œuvre, DonneesTerritoires!D10)
const LOGS_MODALITY_CODE = '1.11'

// Source : Agreste, tableau EXFNR00, colonne code_modalite : 1.12 = « Bois d'industrie » (DonneesTerritoires!D11)
const INDUSTRIAL_WOOD_MODALITY_CODE = '1.12'

// Source : Agreste, tableau EXFNR00, colonne geographie : code département à deux caractères (01 à 95, 2A, 2B)
const DEPARTEMENT_GEOGRAPHY = /^(?:\d{2}|2[AB])$/

// Source : Agreste, tableau EXFNR00, colonne geographie : « NR » suivi du code région INSEE
const REGION_GEOGRAPHY = /^NR(\d{2})$/

// Source : Agreste, tableau EXFNR00, colonne geographie : France métropolitaine
const NATIONAL_GEOGRAPHY = 'METRO'

// Source : choix de conception, non validé : le tableau EXFNR00 ne dit pas si un bois d'industrie absent vaut zéro
// ou est sous secret (2A, 2B, 75, 93, 94 et la Corse pour la région) ; il compte pour 0, sauf pour la France métropolitaine
const ABSENT_INDUSTRIAL_WOOD_VALUE = '0'

function toGeography(geography: string): Result<Geography, InvalidDataset> {
  if (geography === NATIONAL_GEOGRAPHY) return ok({ kind: 'national' })
  const regionCode = REGION_GEOGRAPHY.exec(geography)?.[1]
  if (regionCode !== undefined) return ok({ kind: 'region', code: regionCode })
  if (DEPARTEMENT_GEOGRAPHY.test(geography)) return ok({ kind: 'departement', code: geography })
  return err(
    invalidDataset({
      dataset: harvestDataset,
      reason: 'unreadable',
      detail: `geographie=${geography} is neither a department, a region nor ${NATIONAL_GEOGRAPHY}`,
    }),
  )
}

function toHarvestEntry(row: DataRow): Result<HarvestEntry, InvalidDataset> {
  const dataset = harvestDataset
  return Result.combine([
    requireColumn({ dataset, row, column: 'geographie' }),
    requireColumn({ dataset, row, column: 'code_modalite' }),
    requireColumn({ dataset, row, column: 'valeur_milliers_m3' }),
  ]).andThen(([geography, modalityCode, value]) =>
    roundToLoaderPrecision({ dataset, column: 'valeur_milliers_m3', text: value }).map(
      (thousandM3) => ({ geography, modalityCode, thousandM3 }),
    ),
  )
}

function isSelectedModality(modalityCode: string): boolean {
  return modalityCode === LOGS_MODALITY_CODE || modalityCode === INDUSTRIAL_WOOD_MODALITY_CODE
}

function readSelectedHarvestEntries(
  harvestCsv: string,
): Result<readonly HarvestEntry[], InvalidDataset> {
  const dataset = harvestDataset
  return parseCsvText({ text: harvestCsv, delimiter: ',' })
    .mapErr(toInvalidDataset(dataset))
    .andThen((rows) =>
      Result.combine(
        rows.map((row) =>
          Result.combine([
            requireColumn({ dataset, row, column: 'annee' }),
            requireColumn({ dataset, row, column: 'code_modalite' }),
          ]).map(([year, modalityCode]) => ({ row, year, modalityCode })),
        ),
      ),
    )
    .map((described) =>
      described.filter(
        ({ year, modalityCode }) => year === WOOD_REFERENCE_YEAR && isSelectedModality(modalityCode),
      ),
    )
    .andThen((selected) => Result.combine(selected.map(({ row }) => toHarvestEntry(row))))
}

function findModalityValue({
  geography,
  entries,
  modalityCode,
}: ModalitySelection & { modalityCode: string }): Result<string | undefined, InvalidDataset> {
  const matching = entries.filter((entry) => entry.modalityCode === modalityCode)
  if (matching.length > 1) {
    return err(
      invalidDataset({
        dataset: harvestDataset,
        reason: 'duplicate_key',
        detail: `${geography}:${modalityCode}`,
      }),
    )
  }
  return ok(matching[0]?.thousandM3)
}

function toProduction({
  geography,
  entries,
  located,
}: ModalitySelection & { located: Geography }): Result<Production, InvalidDataset> {
  return Result.combine([
    findModalityValue({ geography, entries, modalityCode: LOGS_MODALITY_CODE }),
    findModalityValue({ geography, entries, modalityCode: INDUSTRIAL_WOOD_MODALITY_CODE }),
  ]).andThen(([logs, industrialWood]) => {
    if (logs === undefined) {
      return err(
        invalidDataset({
          dataset: harvestDataset,
          reason: 'missing_key_column',
          detail: `${geography}:${LOGS_MODALITY_CODE}`,
        }),
      )
    }
    if (industrialWood === undefined && located.kind === 'national') {
      return err(
        invalidDataset({
          dataset: harvestDataset,
          reason: 'missing_key_column',
          detail: `${geography}:${INDUSTRIAL_WOOD_MODALITY_CODE}`,
        }),
      )
    }
    return ok({
      logsThousandM3: logs,
      industrialWoodThousandM3: industrialWood ?? ABSENT_INDUSTRIAL_WOOD_VALUE,
    })
  })
}

function readHarvestProductions(
  harvestCsv: string,
): Result<readonly LocatedProduction[], InvalidDataset> {
  return readSelectedHarvestEntries(harvestCsv).andThen((entries) =>
    Result.combine(
      [...Map.groupBy(entries, ({ geography }) => geography)].map(([geography, geographyEntries]) =>
        toGeography(geography).andThen((located) =>
          toProduction({ geography, entries: geographyEntries, located }).map((production) => ({
            geography: located,
            production,
          })),
        ),
      ),
    ),
  )
}

export { harvestDataset, NATIONAL_GEOGRAPHY, readHarvestProductions }
export type { Geography, LocatedProduction, Production }
