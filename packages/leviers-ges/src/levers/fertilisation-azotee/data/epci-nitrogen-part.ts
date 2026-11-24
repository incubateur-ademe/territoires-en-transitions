import type { Hectares, Tonnes } from '../../../domain/units.ts'

type EpciNitrogenPart = {
  readonly departementDelivered: Tonnes
  readonly epciArea: Hectares
  readonly epciOrganicArea: Hectares
  readonly departementArea: Hectares
  readonly departementOrganicArea: Hectares
}

export type { EpciNitrogenPart }
