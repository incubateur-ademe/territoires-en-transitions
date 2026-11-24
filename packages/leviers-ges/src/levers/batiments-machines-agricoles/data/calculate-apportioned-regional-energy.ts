import { sum } from '../../../domain/big-number.ts'
import { quantity, type Fraction, type MegawattHours } from '../../../domain/units.ts'
import type { AgriculturalConsumption } from './agricultural-consumption.ts'

type RegionalPart = {
  readonly share: Fraction
  readonly regionalConsumption: AgriculturalConsumption
}

type ApportionedEnergy = Pick<AgriculturalConsumption, 'petroleumProducts' | 'heat'>

function sumRegionalShares(
  parts: readonly RegionalPart[],
  selectVector: (consumption: AgriculturalConsumption) => MegawattHours,
): MegawattHours {
  const sharesOfVector = parts.map(({ share, regionalConsumption }) =>
    selectVector(regionalConsumption).times(share),
  )
  return quantity<'MegawattHours'>(sum(sharesOfVector).toFixed())
}

function calculateApportionedRegionalEnergy(parts: readonly RegionalPart[]): ApportionedEnergy {
  return {
    petroleumProducts: sumRegionalShares(parts, (consumption) => consumption.petroleumProducts),
    heat: sumRegionalShares(parts, (consumption) => consumption.heat),
  }
}

export { calculateApportionedRegionalEnergy }
export type { ApportionedEnergy, RegionalPart }
