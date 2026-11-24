import { toGoodsTransportAssumptions } from '../../application/data/transport-marchandises/to-goods-transport-assumptions.ts'
import type { GoodsTransport } from '../../application/data/transport-marchandises/get-goods-transport.ts'
import type { AppliedAssumptions } from '../../application/estimate/estimate-result.ts'
import {
  DEFAULT_CYCLOLOGISTIC_TONNE_KILOMETRES,
  RAIL_FREIGHT_EMISSION_FACTOR,
  WATERWAY_FREIGHT_EMISSION_FACTOR,
} from './report-modal-constants.ts'

function toModalShiftAssumptions(): AppliedAssumptions {
  return {
    railFreightEmissionFactor: {
      value: RAIL_FREIGHT_EMISSION_FACTOR.toFixed(),
      source:
        'Base Empreinte, élément 47691 (train moyen, charge moyenne, France continentale) : combustion 0,004715 plus amont 0,002563, fabrication exclue (DonneesReference!D42)',
      limit: 'Un seul facteur pour toutes les régions, tractions et charges ; la part d’amont comptée n’est pas donnée par le tableur',
    },
    waterwayFreightEmissionFactor: {
      value: WATERWAY_FREIGHT_EMISSION_FACTOR.toFixed(),
      source:
        'FE_fluvial!D25 : moyenne de six facteurs de la Base Empreinte par classe de bateau, combustion seule, pondérée par le nombre de bateaux de la flotte active VNF 2016',
      limit:
        'Combustion seule, là où le facteur ferroviaire ajoute l’amont ; 344 barges non motorisées (32 %) prennent les facteurs des bateaux motorisés',
    },
    modalShiftCoefficients: {
      value: 'fer 0,8064 route et 1,0164 fer, voie d’eau 0,8176 route et 0,9576 voie d’eau',
      source: 'TrsptMarch_ReportModal, formule dessinée et B13 : analyse du programme CEE REMOVE',
      limit:
        'Les quatre coefficients ne figurent pas dans les guides, la FAQ et les manuels REMOVE lus. La formule dessinée associe la part ferroviaire au facteur de la voie d’eau et inversement : l’association suit le Scénario global (formula-corrections.md, numéro 3)',
    },
  }
}

function toCyclologisticAssumption(
  cyclologisticTonneKilometres: string | undefined,
): AppliedAssumptions {
  if (cyclologisticTonneKilometres !== undefined) return {}
  return {
    cyclologisticTonneKilometres: {
      value: DEFAULT_CYCLOLOGISTIC_TONNE_KILOMETRES.toFixed(),
      source: 'ParametreDeterminants : aucune valeur par défaut dans le tableur',
      limit:
        'La cyclologistique retire ses tonnes.km de la base des reports et ne crédite aucune émission évitée : l’augmenter diminue la réduction. Le tableur ne donne aucun plafond : au-delà des tonnes.km de la région, la base est négative',
    },
  }
}

function toAppliedAssumptions({
  goodsTransport,
  cyclologisticTonneKilometres,
}: {
  goodsTransport: GoodsTransport
  cyclologisticTonneKilometres: string | undefined
}): AppliedAssumptions {
  return {
    ...toGoodsTransportAssumptions(goodsTransport),
    ...toModalShiftAssumptions(),
    ...toCyclologisticAssumption(cyclologisticTonneKilometres),
  }
}

export { toAppliedAssumptions }
