import type BigNumber from 'bignumber.js'
import { toBig } from './big-number.ts'
import { quantity } from './units.ts'
import type {
  Fraction,
  KgCo2ePerTonneKilometre,
  KgCo2ePerVehicleKilometre,
  Tonnes,
  Vehicles,
} from './units.ts'

type HeavyVehicleEmissionFactors = {
  readonly thermal: KgCo2ePerTonneKilometre
  readonly mixed: KgCo2ePerTonneKilometre
  readonly zeroEmissionShare: Fraction
}

// Source : hypothèse nommée heavyVehicleLoadFactor (docs/methodology/assumptions.md) : guide SGPE « Panorama des leviers » du 16/02/2024, p. 37, « Taux de remplissage moyen des véhicules lourds : de 8,1t à 8,7t » (8,1 t en 2019) ; DonneesReference!D43 demande « la valeur SNBC3 » sans la donner
const HEAVY_VEHICLE_LOADING_RATE: Tonnes = quantity<'Tonnes'>('8.1')

// Source : Base Empreinte de l'ADEME, élément 28030 « Rigide, 3,5 à 7,5 tonnes, Electrique », poste Amont (carburant) seul, validité avril 2021, incertitude 70 % : 0,0467 kgCO2e par tonne.kilomètre ; total 0,058 dont fabrication 0,0113 exclue
const ELECTRIC_HEAVY_VEHICLE_EMISSION_FACTOR: KgCo2ePerTonneKilometre =
  quantity<'KgCo2ePerTonneKilometre'>('0.0467')

// Source : élément neutre de la multiplication
const ONE: BigNumber = toBig('1')

function calculateThermalEmissionFactor(
  dieselEmissionFactor: KgCo2ePerVehicleKilometre,
): KgCo2ePerTonneKilometre {
  return quantity<'KgCo2ePerTonneKilometre'>(
    dieselEmissionFactor.dividedBy(HEAVY_VEHICLE_LOADING_RATE).toFixed(),
  )
}

function calculateZeroEmissionShare({
  heavyVehicleFleet,
  zeroEmissionFleet,
}: {
  heavyVehicleFleet: Vehicles
  zeroEmissionFleet: Vehicles
}): Fraction {
  return quantity<'Fraction'>(zeroEmissionFleet.dividedBy(heavyVehicleFleet).toFixed())
}

function calculateThermalShare(zeroEmissionShare: Fraction): Fraction {
  return quantity<'Fraction'>(ONE.minus(zeroEmissionShare).toFixed())
}

function calculateHeavyVehicleEmissionFactors({
  dieselEmissionFactor,
  heavyVehicleFleet,
  zeroEmissionFleet,
}: {
  dieselEmissionFactor: KgCo2ePerVehicleKilometre
  heavyVehicleFleet: Vehicles
  zeroEmissionFleet: Vehicles
}): HeavyVehicleEmissionFactors {
  const thermal = calculateThermalEmissionFactor(dieselEmissionFactor)
  const zeroEmissionShare = calculateZeroEmissionShare({ heavyVehicleFleet, zeroEmissionFleet })
  const thermalShare = calculateThermalShare(zeroEmissionShare)
  const thermalContribution = thermalShare.times(thermal)
  const electricContribution = zeroEmissionShare.times(ELECTRIC_HEAVY_VEHICLE_EMISSION_FACTOR)
  return {
    thermal,
    mixed: quantity<'KgCo2ePerTonneKilometre'>(thermalContribution.plus(electricContribution).toFixed()),
    zeroEmissionShare,
  }
}

export {
  calculateHeavyVehicleEmissionFactors,
  calculateThermalShare,
  ELECTRIC_HEAVY_VEHICLE_EMISSION_FACTOR,
  HEAVY_VEHICLE_LOADING_RATE,
}
export type { HeavyVehicleEmissionFactors }
