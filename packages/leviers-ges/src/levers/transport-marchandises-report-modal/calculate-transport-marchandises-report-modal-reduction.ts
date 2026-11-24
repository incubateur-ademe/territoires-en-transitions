import type BigNumber from 'bignumber.js'
import { KILOGRAMS_PER_TONNE } from '../../domain/mass-conversions.ts'
import {
  quantity,
  type Fraction,
  type KgCo2ePerTonneKilometre,
  type TonneKilometres,
  type TonnesCo2ePerYear,
} from '../../domain/units.ts'
import {
  RAIL_FREIGHT_EMISSION_FACTOR,
  RAIL_SHIFT_ADDED_RAIL_RATIO,
  RAIL_SHIFT_AVOIDED_ROAD_RATIO,
  WATERWAY_FREIGHT_EMISSION_FACTOR,
  WATERWAY_SHIFT_ADDED_WATERWAY_RATIO,
  WATERWAY_SHIFT_AVOIDED_ROAD_RATIO,
} from './report-modal-constants.ts'

function calculateShiftBalancePerTonneKilometre({
  roadEmissionFactor,
  avoidedRoadRatio,
  addedModeEmissionFactor,
  addedModeRatio,
}: {
  roadEmissionFactor: KgCo2ePerTonneKilometre
  avoidedRoadRatio: Fraction
  addedModeEmissionFactor: KgCo2ePerTonneKilometre
  addedModeRatio: Fraction
}): BigNumber {
  const avoidedRoadEmissions = roadEmissionFactor.times(avoidedRoadRatio)
  const addedModeEmissions = addedModeEmissionFactor.times(addedModeRatio)
  return avoidedRoadEmissions.minus(addedModeEmissions)
}

function calculateTransportMarchandisesReportModalReduction({
  roadToRail,
  roadToWaterway,
  tonneKilometres,
  cyclologisticTonneKilometres,
  roadEmissionFactor,
}: {
  roadToRail: Fraction
  roadToWaterway: Fraction
  tonneKilometres: TonneKilometres
  cyclologisticTonneKilometres: TonneKilometres
  roadEmissionFactor: KgCo2ePerTonneKilometre
}): TonnesCo2ePerYear {
  const shiftableTonneKilometres = tonneKilometres.minus(cyclologisticTonneKilometres)
  const railBalance = calculateShiftBalancePerTonneKilometre({
    roadEmissionFactor,
    avoidedRoadRatio: RAIL_SHIFT_AVOIDED_ROAD_RATIO,
    addedModeEmissionFactor: RAIL_FREIGHT_EMISSION_FACTOR,
    addedModeRatio: RAIL_SHIFT_ADDED_RAIL_RATIO,
  })
  const waterwayBalance = calculateShiftBalancePerTonneKilometre({
    roadEmissionFactor,
    avoidedRoadRatio: WATERWAY_SHIFT_AVOIDED_ROAD_RATIO,
    addedModeEmissionFactor: WATERWAY_FREIGHT_EMISSION_FACTOR,
    addedModeRatio: WATERWAY_SHIFT_ADDED_WATERWAY_RATIO,
  })
  const railReduction = roadToRail.times(railBalance)
  const waterwayReduction = roadToWaterway.times(waterwayBalance)
  const reductionPerTonneKilometre = railReduction.plus(waterwayReduction)
  const avoidedEmissionsKg = shiftableTonneKilometres.times(reductionPerTonneKilometre)
  return quantity<'TonnesCo2ePerYear'>(avoidedEmissionsKg.dividedBy(KILOGRAMS_PER_TONNE).toFixed())
}

export { calculateTransportMarchandisesReportModalReduction }
