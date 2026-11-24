import { KILOGRAMS_PER_TONNE } from '../../domain/mass-conversions.ts'
import {
  quantity,
  type Fraction,
  type KgCo2ePerKgNitrogen,
  type Tonnes,
  type TonnesCo2ePerYear,
} from '../../domain/units.ts'

// Source : Base Empreinte de l'ADEME, élément 24270, engrais minéraux azotés épandus, France continentale, poste total, version 23.11, validité décembre 2018, incertitude 400 %
const NITROGEN_SPREADING_EMISSION_FACTOR: KgCo2ePerKgNitrogen = quantity<'KgCo2ePerKgNitrogen'>('5.733')

function calculateFertilisationAzoteeReduction({
  nitrogenReductionFraction,
  deliveredNitrogen,
}: {
  nitrogenReductionFraction: Fraction
  deliveredNitrogen: Tonnes
}): TonnesCo2ePerYear {
  const deliveredNitrogenKg = deliveredNitrogen.times(KILOGRAMS_PER_TONNE)
  const avoidedNitrogenKg = deliveredNitrogenKg.times(nitrogenReductionFraction)
  const avoidedEmissionsKg = avoidedNitrogenKg.times(NITROGEN_SPREADING_EMISSION_FACTOR)
  return quantity<'TonnesCo2ePerYear'>(
    avoidedEmissionsKg.dividedBy(KILOGRAMS_PER_TONNE).toFixed(),
  )
}

export { calculateFertilisationAzoteeReduction, NITROGEN_SPREADING_EMISSION_FACTOR }
