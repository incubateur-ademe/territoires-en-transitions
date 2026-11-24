import { quantity, type Fraction } from '../../domain/units.ts'
import type { AnimalChange } from './calculate-elevage-durable-reduction.ts'
import { ANIMAL_TYPES } from './data/animal-types.ts'
import type { LivestockHeadcount } from './data/read-livestock-headcount.ts'
import type { ElevageDurableRequest } from './elevage-durable-request.ts'

type RequestedAnimals = ElevageDurableRequest['parameters']['animals']

// Source : ParametreDeterminants!I9 : valeur par défaut de la baisse du facteur d'émission de fermentation entérique, « 0 »
const DEFAULT_ENTERIC_EMISSION_REDUCTION: Fraction = quantity<'Fraction'>('0')

function toAnimalChanges({
  animals,
  headcount,
}: {
  animals: RequestedAnimals
  headcount: LivestockHeadcount
}): readonly AnimalChange[] {
  return ANIMAL_TYPES.flatMap((animalType) => {
    const requested = animals[animalType]
    if (requested === undefined) return []
    return [
      {
        animalType,
        headcount: headcount[animalType],
        headcountReduction: requested.headcountReductionFraction,
        entericEmissionReduction:
          requested.entericEmissionReductionFraction ?? DEFAULT_ENTERIC_EMISSION_REDUCTION,
        targetShares: requested.targetManureShares,
      },
    ]
  })
}

export { DEFAULT_ENTERIC_EMISSION_REDUCTION, toAnimalChanges }
