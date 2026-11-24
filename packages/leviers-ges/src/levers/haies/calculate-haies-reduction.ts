import { quantity } from '../../domain/units.ts'
import type { Kilometres, TCo2ePerKmPerYear, TonnesCo2ePerYear } from '../../domain/units.ts'

// Source : Label bas carbone, méthode Haies, webinaire du 25/01/2021 p. 6 et page de la méthode,
// rubrique « Les réductions d'émissions » : carbone du sol 0,77 + biomasse racinaire 0,4 tCO2e/km/an
// (bornes basses des deux, biomasse aérienne non comptée). PlanET V1, onglet GestionHaies, constante FS
const HEDGE_STORAGE_FACTOR: TCo2ePerKmPerYear = quantity<'TCo2ePerKmPerYear'>('1.17')

function calculateHaiesReduction(
  hedgeKmCreatedPerYear: Kilometres,
  storageFactor: TCo2ePerKmPerYear,
): TonnesCo2ePerYear {
  return quantity<'TonnesCo2ePerYear'>(hedgeKmCreatedPerYear.times(storageFactor).toFixed())
}

export { calculateHaiesReduction, HEDGE_STORAGE_FACTOR }
