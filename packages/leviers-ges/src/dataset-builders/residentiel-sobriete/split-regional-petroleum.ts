import type BigNumber from 'bignumber.js'
import { err, ok, type Result } from 'neverthrow'
import { toBig } from '../../domain/big-number.ts'
import { invalidDataset, type InvalidDataset } from '../../domain/data-source.ts'
import { gigawattHoursToMegawattHours, quantity } from '../../domain/units.ts'
import type { RegionalPetroleumMwh } from './apportion-oil-sales.ts'
import { cerenDataset } from './read-ceren-fuel-consumption.ts'
import type { RegionalBilan } from './read-regional-bilan.ts'

type FuelShares = {
  readonly fuelOilShare: BigNumber
  readonly liquefiedPetroleumGasShare: BigNumber
}

type RegionalEnergy = {
  readonly regionCode: string
  readonly electricityGwh: BigNumber
  readonly naturalGasGwh: BigNumber
  readonly fuelOilGwh: BigNumber
  readonly liquefiedPetroleumGasGwh: BigNumber
  readonly heatGwh: BigNumber
}

function toEmptyFuelSharesError(detail: string): InvalidDataset {
  return invalidDataset({ dataset: cerenDataset, reason: 'empty_dataset', detail })
}

function calculateFuelShares({
  fuelOilTwh,
  liquefiedPetroleumGasTwh,
}: {
  fuelOilTwh: string
  liquefiedPetroleumGasTwh: string
}): Result<FuelShares, InvalidDataset> {
  const fuelOilConsumptionTwh = toBig(fuelOilTwh)
  const liquefiedPetroleumGasConsumptionTwh = toBig(liquefiedPetroleumGasTwh)
  const petroleumTwh = fuelOilConsumptionTwh.plus(liquefiedPetroleumGasConsumptionTwh)
  if (petroleumTwh.isZero()) {
    return err(toEmptyFuelSharesError('CEREN fuel oil and LPG consumption sum to 0'))
  }
  return ok({
    fuelOilShare: fuelOilConsumptionTwh.dividedBy(petroleumTwh),
    liquefiedPetroleumGasShare: liquefiedPetroleumGasConsumptionTwh.dividedBy(petroleumTwh),
  })
}

function toRegionalEnergy({
  bilan,
  shares,
}: {
  bilan: RegionalBilan
  shares: FuelShares
}): RegionalEnergy {
  const petroleumProductsGwh = toBig(bilan.petroleumProductsGwh)
  return {
    regionCode: bilan.regionCode,
    electricityGwh: toBig(bilan.electricityGwh),
    naturalGasGwh: toBig(bilan.naturalGasGwh),
    fuelOilGwh: petroleumProductsGwh.times(shares.fuelOilShare),
    liquefiedPetroleumGasGwh: petroleumProductsGwh.times(shares.liquefiedPetroleumGasShare),
    heatGwh: toBig(bilan.heatGwh),
  }
}

function toRegionalPetroleumMwh(regionalEnergy: RegionalEnergy): RegionalPetroleumMwh {
  const fuelOilGwh = quantity<'GigawattHours'>(regionalEnergy.fuelOilGwh.toFixed())
  const liquefiedPetroleumGasGwh = quantity<'GigawattHours'>(
    regionalEnergy.liquefiedPetroleumGasGwh.toFixed(),
  )
  return {
    fuelOilMwh: gigawattHoursToMegawattHours(fuelOilGwh),
    liquefiedPetroleumGasMwh: gigawattHoursToMegawattHours(liquefiedPetroleumGasGwh),
  }
}

export { calculateFuelShares, toRegionalEnergy, toRegionalPetroleumMwh }
export type { FuelShares, RegionalEnergy }
