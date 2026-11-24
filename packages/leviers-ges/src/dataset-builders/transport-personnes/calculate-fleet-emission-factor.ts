import type BigNumber from 'bignumber.js'
import { sum } from '../../domain/big-number.ts'

type FleetCounts = Readonly<Record<string, BigNumber>>

type FleetEmissionFactor = {
  readonly classifiedVehicles: BigNumber
  readonly classifiedShare: BigNumber
  readonly emissionFactor: BigNumber | undefined
  readonly unclassifiedShare: BigNumber
}

// Source : élément neutre de l'addition
const NO_VEHICLES = sum([])

function countOf({ counts, fuel }: { counts: FleetCounts; fuel: string }): BigNumber {
  return counts[fuel] ?? NO_VEHICLES
}

function calculateFleetEmissionFactor({
  counts,
  emissionFactors,
}: {
  counts: FleetCounts
  emissionFactors: Readonly<Record<string, string>>
}): FleetEmissionFactor {
  const classifiedEntries = Object.entries(emissionFactors)
  const classifiedVehicles = sum(classifiedEntries.map(([fuel]) => countOf({ counts, fuel })))
  const totalVehicles = sum(Object.values(counts))
  const emissions = sum(
    classifiedEntries.map(([fuel, factor]) => countOf({ counts, fuel }).times(factor)),
  )
  const unclassifiedVehicles = totalVehicles.minus(classifiedVehicles)
  return {
    classifiedVehicles,
    classifiedShare: totalVehicles.isZero() ? totalVehicles : classifiedVehicles.dividedBy(totalVehicles),
    emissionFactor: classifiedVehicles.isZero() ? undefined : emissions.dividedBy(classifiedVehicles),
    unclassifiedShare: totalVehicles.isZero() ? totalVehicles : unclassifiedVehicles.dividedBy(totalVehicles),
  }
}

export { calculateFleetEmissionFactor }
export type { FleetCounts, FleetEmissionFactor }
