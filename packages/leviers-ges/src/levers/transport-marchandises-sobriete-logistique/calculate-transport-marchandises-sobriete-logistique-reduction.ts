import { KILOGRAMS_PER_TONNE } from '../../domain/mass-conversions.ts'
import {
  quantity,
  type Fraction,
  type KgCo2ePerTonneKilometre,
  type TonneKilometres,
  type TonnesCo2ePerYear,
} from '../../domain/units.ts'

function calculateTransportMarchandisesSobrieteLogistiqueReduction({
  roadFreightReduction,
  tonneKilometres,
  emissionFactor,
}: {
  roadFreightReduction: Fraction
  tonneKilometres: TonneKilometres
  emissionFactor: KgCo2ePerTonneKilometre
}): TonnesCo2ePerYear {
  const avoidedTonneKilometres = tonneKilometres.times(roadFreightReduction)
  const avoidedEmissionsKg = avoidedTonneKilometres.times(emissionFactor)
  return quantity<'TonnesCo2ePerYear'>(avoidedEmissionsKg.dividedBy(KILOGRAMS_PER_TONNE).toFixed())
}

export { calculateTransportMarchandisesSobrieteLogistiqueReduction }
