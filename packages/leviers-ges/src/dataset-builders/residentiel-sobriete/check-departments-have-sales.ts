import { err, ok, type Result } from 'neverthrow'
import { invalidDataset, type InvalidDataset } from '../../domain/data-source.ts'
import type { OilSales } from './read-oil-sales.ts'

const checkedDataset = 'residentiel-sobriete/departements.csv'

// Source : Insee, code officiel géographique : un département d'outre-mer a un code de trois chiffres qui commence par 97 (971 à 976)
const OVERSEAS_DEPARTMENT_CODE = /^97\d$/

function checkDepartmentsHaveSales({
  consumptionByDepartment,
  sales,
}: {
  consumptionByDepartment: ReadonlyMap<string, string>
  sales: readonly OilSales[]
}): Result<undefined, InvalidDataset> {
  const departmentsWithSales = new Set(sales.map(({ departementCode }) => departementCode))
  const departmentWithoutSales = [...consumptionByDepartment.keys()].find(
    (departementCode) =>
      !departmentsWithSales.has(departementCode) && !OVERSEAS_DEPARTMENT_CODE.test(departementCode),
  )
  return departmentWithoutSales === undefined
    ? ok(undefined)
    : err(
        invalidDataset({
          dataset: checkedDataset,
          reason: 'missing_key_column',
          detail: `department ${departmentWithoutSales} has consumption but no oil sales`,
        }),
      )
}

export { checkDepartmentsHaveSales }
