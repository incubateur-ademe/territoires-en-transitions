import { Result, err, ok } from 'neverthrow'
import { requireColumn } from '../../application/require-column.ts'
import { invalidDataset, type DataRow, type InvalidDataset } from '../../domain/data-source.ts'
import { parseCsvText } from '../../infrastructure/csv/parse-csv-text.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'
import { roundToLoaderPrecision } from '../round-to-loader-precision.ts'
import { WOOD_REFERENCE_YEAR } from './wood-reference-year.ts'

type ProductsCarbon = {
  readonly timberProductsCarbonTc: string
  readonly industrialProductsCarbonTc: string
}

type DescribedRow = { readonly row: DataRow; readonly year: string }

const productsCarbonDataset = 'produits-bois/sources/ominea-2026-tableau-45-produits-bois-tc.csv'

// Source : OMINEA 2026, UTCATF, tableau 45, p. 97 : colonne « bois d'œuvre » (sciages plus contreplaqués), tC/an
const TIMBER_PRODUCTS_CARBON_COLUMN = 'bois_oeuvre_tC_sciages_plus_contreplaques'

// Source : OMINEA 2026, UTCATF, tableau 45, p. 97 : colonne « bois d'industrie » (panneaux plus papier), tC/an
const INDUSTRIAL_PRODUCTS_CARBON_COLUMN = 'bois_industrie_tC_panneaux_plus_papier'

function findReferenceYearRow(rows: readonly DescribedRow[]): Result<DataRow, InvalidDataset> {
  const referenceYearRow = rows.find(({ year }) => year === WOOD_REFERENCE_YEAR)
  return referenceYearRow === undefined
    ? err(
        invalidDataset({
          dataset: productsCarbonDataset,
          reason: 'missing_key_column',
          detail: WOOD_REFERENCE_YEAR,
        }),
      )
    : ok(referenceYearRow.row)
}

function readProductsCarbon(productsCarbonCsv: string): Result<ProductsCarbon, InvalidDataset> {
  const dataset = productsCarbonDataset
  return parseCsvText({ text: productsCarbonCsv, delimiter: ',' })
    .mapErr(toInvalidDataset(dataset))
    .andThen((rows) =>
      Result.combine(
        rows.map((row) => requireColumn({ dataset, row, column: 'annee' }).map((year) => ({ row, year }))),
      ),
    )
    .andThen(findReferenceYearRow)
    .andThen((row) =>
      Result.combine([
        requireColumn({ dataset, row, column: TIMBER_PRODUCTS_CARBON_COLUMN }),
        requireColumn({ dataset, row, column: INDUSTRIAL_PRODUCTS_CARBON_COLUMN }),
      ]),
    )
    .andThen(([timber, industrial]) =>
      Result.combine([
        roundToLoaderPrecision({ dataset, column: TIMBER_PRODUCTS_CARBON_COLUMN, text: timber }),
        roundToLoaderPrecision({ dataset, column: INDUSTRIAL_PRODUCTS_CARBON_COLUMN, text: industrial }),
      ]),
    )
    .map(([timberProductsCarbonTc, industrialProductsCarbonTc]) => ({
      timberProductsCarbonTc,
      industrialProductsCarbonTc,
    }))
}

export { readProductsCarbon }
export type { ProductsCarbon }
