import type { AppliedAssumptions } from '../../application/estimate/estimate-result.ts'
import { NITROGEN_SPREADING_EMISSION_FACTOR } from './calculate-fertilisation-azotee-reduction.ts'

function toAppliedAssumptions(): AppliedAssumptions {
  return {
    nitrogenCampaigns: {
      value: 'moyenne des campagnes 2022-2023 (révisée) et 2023-2024',
      source:
        'DonneesTerritoires!D8 : prendre la moyenne sur deux ans ; UNIFA, livraisons de la campagne 2023-2024 par région et par département, la campagne 2022-2023 étant révisée par l’évolution publiée',
      limit:
        'Les livraisons sont comptées là où se trouve le distributeur, non là où l’azote est épandu, limite que le tableur assume (ChgtPratiques!B13). Deux campagnes seulement ; la valeur 2022-2023 est déduite d’une évolution publiée arrondie à 0,1 %',
    },
    nitrogenSpreadingEmissionFactor: {
      value: NITROGEN_SPREADING_EMISSION_FACTOR.toFixed(),
      source: 'Base Empreinte, élément 24270, engrais azoté minéral épandu, kgCO2e par kg d’azote',
      limit:
        'Incertitude de 400 % dans la Base Empreinte ; une valeur nationale pour la France continentale, appliquée à tous les territoires, Corse comprise',
    },
  }
}

export { toAppliedAssumptions }
