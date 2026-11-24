import { ELECTRIC_HEAVY_VEHICLE_EMISSION_FACTOR, HEAVY_VEHICLE_LOADING_RATE } from '../../../domain/heavy-vehicle-emission-factor.ts'
import type { AppliedAssumptions } from '../../estimate/estimate-result.ts'
import type { GoodsTransport } from './get-goods-transport.ts'

// Source : choix de conception, non validé : précision d'affichage des facteurs renvoyés dans appliedAssumptions
const DISPLAYED_DECIMAL_PLACES = 6

function toFlowsAssumption(): AppliedAssumptions {
  return {
    includeInternationalFlows: {
      value: 'flux internes plus 50 % des flux chargés ou déchargés dans la région, étranger compris',
      source:
        'DonneesTerritoires!D17 ; SDES, Le TRM des pavillons européens en 2024, feuille reg_type_flux',
      limit:
        'Sans les flux internationaux, les 13 régions passent de 239,97 à 171,71 milliards de tonnes.km ; avec eux, une région a de 18 % (Corse) à 62 % (Hauts-de-France) de tonnes.km en plus',
    },
  }
}

function toEmissionFactorAssumptions({ inputs, emissionFactors }: GoodsTransport): AppliedAssumptions {
  return {
    heavyVehicleTripType: {
      value: 'type de trajet par défaut du tableur, route et ville, poids lourds diesel de la région',
      source:
        "OMINEA 2024 (CITEPA), CO2 des poids lourds diesel, type de trajet par défaut de FE_transports (A22, A31) : 50 % SNAP 070302PL et 50 % 070303PL, norme Euro choisie selon Crit'Air (FE_transports), pondérée par le parc de la région, divisée par le taux de chargement",
      limit:
        'Le tableur ne dit pas quel type de trajet s’applique au transport de marchandises : sa valeur par défaut est appliquée. La longue distance (070301PL et 070302PL) est 24,5 % plus basse. CO2 seul : CH4 et N2O ajouteraient environ 1,7 %. Le parc est celui immatriculé dans la région, non celui qui y circule',
    },
    heavyVehicleThermalEmissionFactor: {
      value: emissionFactors.thermal.decimalPlaces(DISPLAYED_DECIMAL_PLACES).toFixed(),
      source:
        'OMINEA 2024 (CITEPA), CO2 diesel par véhicule.km du parc de la région, divisé par le taux de chargement, en kgCO2e par tonne.km',
      limit: 'Appliqué à la part du parc qui n’est pas à zéro émission ; le reste prend le facteur électrique',
    },
    heavyVehicleLoadFactor: {
      value: HEAVY_VEHICLE_LOADING_RATE.toFixed(),
      source:
        'SGPE, Panorama des leviers, 16/02/2024, p. 37 : taux de remplissage moyen des poids lourds de 8,1 t à 8,7 t (DonneesReference!D43 demande la valeur de la SNBC 3 sans la donner)',
      limit: '8,1 t est la valeur 2019, 8,7 t l’objectif 2030',
    },
    dieselUnclassifiedShare: {
      value: inputs.dieselUnclassifiedShare.toFixed(),
      source: 'SDES, Parc de véhicules routiers (RSVERO) au 1er janvier 2024, poids lourds de la région',
      limit:
        "Cette part des poids lourds diesel de la région n'a pas de vignette Crit'Air 1 à 5 et est exclue de la moyenne diesel",
    },
    electricHeavyVehicleEmissionFactor: {
      value: ELECTRIC_HEAVY_VEHICLE_EMISSION_FACTOR.toFixed(),
      source: 'Base Empreinte, élément 28030 (porteur de 3,5 à 7,5 t, électrique), amont uniquement',
      limit:
        'Un seul facteur électrique pour tous les poids lourds, y compris ceux de plus de 7,5 t ; l’hydrogène est traité comme l’électrique ; validité avril 2021, incertitude 70 %',
    },
  }
}

function toGoodsTransportAssumptions(goodsTransport: GoodsTransport): AppliedAssumptions {
  return { ...toFlowsAssumption(), ...toEmissionFactorAssumptions(goodsTransport) }
}

export { DISPLAYED_DECIMAL_PLACES, toGoodsTransportAssumptions }
