import { Result, err, ok } from 'neverthrow'
import { parseBig } from '../../../domain/big-number.ts'
import {
  invalidDataset,
  type DataSource,
  type DataSourceError,
} from '../../../domain/data-source.ts'
import { quantity, type Quantity, type UnitName } from '../../../domain/units.ts'
import type { NationalWood } from './wood-production.ts'

const constantsDataset = 'produits-bois/constants'

// Source : data/produits-bois/manifest.json, clés de constants.csv construites par pnpm build:data:produits-bois
const CONSTANT_NAMES = {
  nationalLogs: 'national_logs_thousand_m3',
  nationalIndustrialWood: 'national_industrial_wood_thousand_m3',
  timberProductsCarbon: 'timber_products_carbon_tc',
  industrialProductsCarbon: 'industrial_products_carbon_tc',
} as const

function readQuantityConstant<U extends UnitName>({
  dataSource,
  name,
}: {
  dataSource: DataSource
  name: string
}): Result<Quantity<U>, DataSourceError> {
  return dataSource
    .constant(constantsDataset, name)
    .andThen((value) =>
      parseBig(value).isOk()
        ? ok(quantity<U>(value))
        : err(
            invalidDataset({
              dataset: constantsDataset,
              reason: 'unreadable',
              detail: `${name}=${value} is not a decimal number`,
            }),
          ),
    )
}

function readNationalWood(dataSource: DataSource): Result<NationalWood, DataSourceError> {
  return Result.combine([
    readQuantityConstant<'ThousandCubicMetres'>({ dataSource, name: CONSTANT_NAMES.nationalLogs }),
    readQuantityConstant<'ThousandCubicMetres'>({
      dataSource,
      name: CONSTANT_NAMES.nationalIndustrialWood,
    }),
    readQuantityConstant<'TonnesCarbon'>({ dataSource, name: CONSTANT_NAMES.timberProductsCarbon }),
    readQuantityConstant<'TonnesCarbon'>({
      dataSource,
      name: CONSTANT_NAMES.industrialProductsCarbon,
    }),
  ]).map(([logs, industrialWood, timber, industrial]) => ({
    production: { logs, industrialWood },
    productsCarbon: { timber, industrial },
  }))
}

export { readNationalWood }
