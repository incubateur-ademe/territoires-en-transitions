import type BigNumber from 'bignumber.js'
import { sum, toBig } from '../../domain/big-number.ts'
import { quantity, type Tonnes } from '../../domain/units.ts'
import type { EpciNitrogenPart } from './data/epci-nitrogen-part.ts'

// Source : choix de conception, non validé : un département dont la SAU hors bio est nulle ou négative (Paris et Hauts-de-Seine : bio 2024 supérieure à la SAU 2020) ne peut pas être ventilé ; l'EPCI n'en reçoit rien
const NO_SHARE: BigNumber = toBig('0')

// Source : choix de conception, non validé : la part d'un EPCI dans l'azote d'un département est plafonnée à 1, la bio d'un EPCI sous secret statistique n'étant pas dans celle du département
const WHOLE_DEPARTEMENT: BigNumber = toBig('1')

function toNonNegative(area: BigNumber): BigNumber {
  return area.isNegative() ? NO_SHARE : area
}

function toDepartementShare(part: EpciNitrogenPart): BigNumber {
  const departementConventionalArea = part.departementArea.minus(part.departementOrganicArea)
  if (departementConventionalArea.isLessThanOrEqualTo(NO_SHARE)) return NO_SHARE
  const epciConventionalArea = toNonNegative(part.epciArea.minus(part.epciOrganicArea))
  const share = epciConventionalArea.dividedBy(departementConventionalArea)
  return share.isGreaterThan(WHOLE_DEPARTEMENT) ? WHOLE_DEPARTEMENT : share
}

function calculateEpciDeliveredNitrogen(parts: readonly EpciNitrogenPart[]): Tonnes {
  const apportioned = parts.map((part) => part.departementDelivered.times(toDepartementShare(part)))
  return quantity<'Tonnes'>(sum(apportioned).toFixed())
}

export { calculateEpciDeliveredNitrogen }
