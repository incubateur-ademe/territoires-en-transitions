import type { Result } from 'neverthrow'
import { areAllCommunesInRegion } from './are-all-communes-in-region.ts'
import type { RegionLookup } from '../../estimate/estimation-context.ts'
import type { DataSourceError } from '../../../domain/data-source.ts'
import { ELECTRICITY_EMISSION_FACTOR_SHARE } from '../../../domain/emission-factors.ts'
import { quantity, type KgCo2ePerPassengerKilometre } from '../../../domain/units.ts'
import type { RailEmissionFactor } from './rail-emission-factor.ts'

// Source : DonneesReference!D37, France continentale « TER moyen » ; Base Empreinte, élément 43255 (TER 2022, traction moyenne), poste amont : 0,0229 kgCO2e/passager.km, fabrication (0,00479) non comptée, combustion nulle
const MAINLAND_RAIL_UPSTREAM_EMISSION_FACTOR: KgCo2ePerPassengerKilometre =
  quantity<'KgCo2ePerPassengerKilometre'>('0.0229')

// Source : documentation fonctionnelle PlanET (juin 2026), p. 65 : facteur du ferré « Amont * 67,4 % et combustion », combustion nulle pour le TER moyen 2022 (hypothèse nommée railElectricityUpstreamShare)
const MAINLAND_RAIL_EMISSION_FACTOR: KgCo2ePerPassengerKilometre =
  quantity<'KgCo2ePerPassengerKilometre'>(
    MAINLAND_RAIL_UPSTREAM_EMISSION_FACTOR.times(ELECTRICITY_EMISSION_FACTOR_SHARE).toFixed(),
  )

// Source : DonneesReference!D37, « Corse : uniquement 1 train de voyageur » ; Base Empreinte, train de voyageurs de Corse (hypothèse nommée railElectricityUpstreamShare)
const CORSICA_RAIL_EMISSION_FACTOR: KgCo2ePerPassengerKilometre =
  quantity<'KgCo2ePerPassengerKilometre'>('0.187')

// Source : Insee, code officiel géographique : code de la région Corse
const CORSICA_REGION_CODE = '94'

function resolveRailEmissionFactor({
  communes,
  getRegionByCommune,
}: {
  communes: readonly string[]
  getRegionByCommune: RegionLookup
}): Result<RailEmissionFactor, DataSourceError> {
  return areAllCommunesInRegion({
    communes,
    regionCode: CORSICA_REGION_CODE,
    getRegionByCommune,
  }).map((isCorsican) => {
    const emissionFactor = isCorsican ? CORSICA_RAIL_EMISSION_FACTOR : MAINLAND_RAIL_EMISSION_FACTOR
    return { emissionFactor, isCorsican }
  })
}

export { resolveRailEmissionFactor }
