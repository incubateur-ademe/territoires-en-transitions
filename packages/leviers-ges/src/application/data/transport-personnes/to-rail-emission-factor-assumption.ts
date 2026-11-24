import type { AppliedAssumptions } from '../../estimate/estimate-result.ts'
import type { RailEmissionFactor } from './rail-emission-factor.ts'

function toRailEmissionFactorAssumption(railEmissionFactor: RailEmissionFactor): AppliedAssumptions {
  return {
    railEmissionFactor: {
      value: railEmissionFactor.emissionFactor.toFixed(),
      source: railEmissionFactor.isCorsican
        ? 'Base Empreinte, train de voyageurs corse, en kgCO2e par passager.km. Choix de conception, non validé : seul un territoire entièrement en Corse le prend, un territoire à cheval sur la Corse et une autre région prend le facteur continental'
        : 'Base Empreinte, TER moyen 2022, électricité amont 0,0229 multipliée par la part de 67,4 % de la documentation fonctionnelle PlanET, p. 65 (fabrication 0,00479 non comptée, combustion nulle), en kgCO2e par passager.km',
      limit:
        'Une seule valeur pour tout le ferroviaire (métro, tramway, train) : un territoire doté d’un réseau de métro ou de tramway a son propre facteur, généralement plus bas',
    },
  }
}

export { toRailEmissionFactorAssumption }
