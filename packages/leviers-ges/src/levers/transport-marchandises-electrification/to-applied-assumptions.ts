import type { GoodsTransport } from '../../application/data/transport-marchandises/get-goods-transport.ts'
import {
  DISPLAYED_DECIMAL_PLACES,
  toGoodsTransportAssumptions,
} from '../../application/data/transport-marchandises/to-goods-transport-assumptions.ts'
import type { AppliedAssumptions } from '../../application/estimate/estimate-result.ts'
import type { Fraction } from '../../domain/units.ts'
import { calculateThermalShare } from '../../domain/heavy-vehicle-emission-factor.ts'

function toElectrificationCapAssumption({
  goodsTransport,
  requestedElectrifiedShare,
  electrifiedShare,
}: {
  goodsTransport: GoodsTransport
  requestedElectrifiedShare: Fraction
  electrifiedShare: Fraction
}): AppliedAssumptions {
  if (electrifiedShare.isEqualTo(requestedElectrifiedShare)) return {}
  const thermalShare = calculateThermalShare(goodsTransport.emissionFactors.zeroEmissionShare)
  return {
    additionalElectrifiedFleetFraction: {
      value: electrifiedShare.decimalPlaces(DISPLAYED_DECIMAL_PLACES).toFixed(),
      source:
        'SDES, Parc de véhicules routiers (RSVERO) au 1er janvier 2024 : la part thermique des poids lourds de la région est la marge restante pour l’électrification (ParametreDeterminants!D41 : points de pourcentage d’électrification supplémentaire)',
      limit: thermalShare.isZero()
        ? 'Tous les poids lourds de la région sont déjà à zéro émission : rien ne peut être électrifié'
        : 'La part d’électrification demandée dépasse la part de poids lourds thermiques de la région : seuls les poids lourds thermiques peuvent être électrifiés, la part demandée est plafonnée',
    },
  }
}

function toAppliedAssumptions({
  goodsTransport,
  requestedElectrifiedShare,
  electrifiedShare,
}: {
  goodsTransport: GoodsTransport
  requestedElectrifiedShare: Fraction
  electrifiedShare: Fraction
}): AppliedAssumptions {
  return {
    ...toGoodsTransportAssumptions(goodsTransport),
    ...toElectrificationCapAssumption({ goodsTransport, requestedElectrifiedShare, electrifiedShare }),
  }
}

export { toAppliedAssumptions }
