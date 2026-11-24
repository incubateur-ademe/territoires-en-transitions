import type { AppliedAssumptions } from '../../estimate/estimate-result.ts'
import type { RailShare } from './resolve-rail-share.ts'

function toRailShareAssumption(railShare: RailShare): AppliedAssumptions {
  if (!railShare.defaulted) return {}
  return {
    railShare: {
      value: railShare.fraction.toFixed(),
      source:
        'SDES, Bilan annuel des transports 2024 : part du ferroviaire dans les passagers.km des transports en commun, 82 % en Île-de-France et 24 % ailleurs',
      limit:
        'Une valeur par groupe de régions : un territoire doté d’un grand réseau de métro ou de tramway hors Île-de-France (Lyon, Marseille, Lille) a une part ferroviaire plus élevée, donc ses transports en commun routiers sont surestimés. Un territoire à cheval sur l’Île-de-France et une autre région, ou avec une commune de région inconnue, prend 24 %',
    },
  }
}

export { toRailShareAssumption }
