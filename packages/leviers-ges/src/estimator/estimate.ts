import { Result, ok } from 'neverthrow'
import { match } from 'ts-pattern'
import { computedStatusOf } from '../application/estimate/ensure-level-computed.ts'
import { recordDatasetReads } from '../application/estimate/record-dataset-reads.ts'
import { createEstimationContext } from '../application/estimate/create-estimation-context.ts'
import type { EstimateResult } from '../application/estimate/estimate-result.ts'
import type { EstimationError } from '../application/estimate/estimation-error.ts'
import type { DataSource, DatasetProvenance } from '../domain/data-source.ts'
import { LEVER_LIMITS, type LeverLimit } from '../domain/lever-limits.ts'
import type { ComputedStatus } from '../domain/lever-registry.ts'
import type { Level } from '../domain/territory.ts'
import {
  estimate as estimateBatimentsMachinesAgricoles,
  type BatimentsMachinesAgricolesRequestInput,
} from '../levers/batiments-machines-agricoles/index.ts'
import {
  estimate as estimateDechetsModeDeTraitement,
  type DechetsModeDeTraitementRequestInput,
} from '../levers/dechets-mode-de-traitement/index.ts'
import {
  estimate as estimateDechetsSobriete,
  type DechetsSobrieteRequestInput,
} from '../levers/dechets-sobriete/index.ts'
import {
  estimate as estimateElevageDurable,
  type ElevageDurableRequestInput,
} from '../levers/elevage-durable/index.ts'
import {
  estimate as estimateFertilisationAzotee,
  type FertilisationAzoteeRequestInput,
} from '../levers/fertilisation-azotee/index.ts'
import { type HaiesRequestInput, estimate as estimateHaies } from '../levers/haies/index.ts'
import {
  estimate as estimateOccupationDesSols,
  type OccupationDesSolsRequestInput,
} from '../levers/occupation-des-sols/index.ts'
import {
  estimate as estimatePratiquesStockantes,
  type PratiquesStockantesRequestInput,
} from '../levers/pratiques-stockantes/index.ts'
import {
  estimate as estimateProduitsBois,
  type ProduitsBoisRequestInput,
} from '../levers/produits-bois/index.ts'
import {
  estimate as estimateReseauxChaleur,
  type ReseauxChaleurRequestInput,
} from '../levers/reseaux-chaleur/index.ts'
import {
  estimate as estimateResidentielChangementSystemeChauffage,
  type ResidentielChangementSystemeChauffageRequestInput,
} from '../levers/residentiel-changement-systeme-chauffage/index.ts'
import {
  estimate as estimateResidentielRenovation,
  type ResidentielRenovationRequestInput,
} from '../levers/residentiel-renovation/index.ts'
import {
  estimate as estimateResidentielSobriete,
  type ResidentielSobrieteRequestInput,
} from '../levers/residentiel-sobriete/index.ts'
import {
  estimate as estimateTransportMarchandisesEfficacite,
  type TransportMarchandisesEfficaciteRequestInput,
} from '../levers/transport-marchandises-efficacite/index.ts'
import {
  estimate as estimateTransportMarchandisesElectrification,
  type TransportMarchandisesElectrificationRequestInput,
} from '../levers/transport-marchandises-electrification/index.ts'
import {
  estimate as estimateTransportMarchandisesReportModal,
  type TransportMarchandisesReportModalRequestInput,
} from '../levers/transport-marchandises-report-modal/index.ts'
import {
  estimate as estimateTransportMarchandisesSobrieteLogistique,
  type TransportMarchandisesSobrieteLogistiqueRequestInput,
} from '../levers/transport-marchandises-sobriete-logistique/index.ts'
import {
  estimate as estimateTransportPersonnesEfficacite,
  type TransportPersonnesEfficaciteRequestInput,
} from '../levers/transport-personnes-efficacite/index.ts'
import {
  estimate as estimateTransportPersonnesElectrification,
  type TransportPersonnesElectrificationRequestInput,
} from '../levers/transport-personnes-electrification/index.ts'
import {
  estimate as estimateTransportPersonnesReportModal,
  type TransportPersonnesReportModalRequestInput,
} from '../levers/transport-personnes-report-modal/index.ts'
import {
  estimate as estimateTransportPersonnesSobrieteDeplacements,
  type TransportPersonnesSobrieteDeplacementsRequestInput,
} from '../levers/transport-personnes-sobriete-deplacements/index.ts'
import { estimateOnComputedLevel } from './estimate-on-computed-level.ts'
import { parseRequest, type ParsedRequest } from './parse-request.ts'

type RequestInput =
  | BatimentsMachinesAgricolesRequestInput
  | DechetsModeDeTraitementRequestInput
  | DechetsSobrieteRequestInput
  | ElevageDurableRequestInput
  | FertilisationAzoteeRequestInput
  | HaiesRequestInput
  | OccupationDesSolsRequestInput
  | PratiquesStockantesRequestInput
  | ProduitsBoisRequestInput
  | ReseauxChaleurRequestInput
  | ResidentielChangementSystemeChauffageRequestInput
  | ResidentielRenovationRequestInput
  | ResidentielSobrieteRequestInput
  | TransportMarchandisesEfficaciteRequestInput
  | TransportMarchandisesElectrificationRequestInput
  | TransportMarchandisesReportModalRequestInput
  | TransportMarchandisesSobrieteLogistiqueRequestInput
  | TransportPersonnesEfficaciteRequestInput
  | TransportPersonnesElectrificationRequestInput
  | TransportPersonnesReportModalRequestInput
  | TransportPersonnesSobrieteDeplacementsRequestInput

type Lever = RequestInput['id']

type StatusedEstimateResult = EstimateResult & {
  readonly status: ComputedStatus
  readonly limits: readonly LeverLimit[]
  readonly datasets: readonly DatasetProvenance[]
}

type EstimateByLever = Record<Lever, StatusedEstimateResult>

type Estimate<L extends Lever = Lever> = EstimateByLever[L]

type Estimator = <E extends RequestInput>(input: E) => Result<Estimate<E['id']>, EstimationError>

// Source : choix de conception, non validé : haies et pratiques_stockantes n'ont pas de territoire, leurs trois niveaux ont le même statut dans le registre (src/domain/lever-registry.ts)
const LEVEL_OF_TERRITORY_LESS_LEVERS: Level = 'region'

// Source : choix de conception, non validé : le référentiel des communes sert à tous les leviers et n'entre pas dans la provenance des données d'un résultat
const TERRITORY_DATASET_PREFIX = 'territoires/'

function levelOf(request: ParsedRequest): Level {
  return 'territory' in request ? request.territory.level : LEVEL_OF_TERRITORY_LESS_LEVERS
}

function createEstimator(dataSource: DataSource): Estimator {
  const recorder = recordDatasetReads(dataSource)
  const context = createEstimationContext(recorder.dataSource)

  function estimate<E extends RequestInput>(input: E): Result<Estimate<E['id']>, EstimationError>
  function estimate(input: RequestInput): Result<Estimate, EstimationError> {
    return parseRequest(input).andThen((request) => {
      recorder.takeReadDatasets()
      return estimateLever(request).andThen((leverEstimate) =>
        computedStatusOf({ lever: request.id, level: levelOf(request) }).andThen((status) =>
          Result.combine(
            recorder
              .takeReadDatasets()
              .filter((dataset) => !dataset.startsWith(TERRITORY_DATASET_PREFIX))
              .map((dataset) => dataSource.provenance(dataset)),
          ).map((datasets) => ({
            ...leverEstimate,
            status,
            limits: LEVER_LIMITS[request.id],
            datasets,
          })),
        ),
      )
    })
  }

  function estimateLever(request: ParsedRequest): Result<EstimateResult, EstimationError> {
    return match(request)
        .with({ id: 'batiments_machines_agricoles' }, (batimentsMachinesAgricolesRequest) =>
          estimateOnComputedLevel(batimentsMachinesAgricolesRequest, (computedLevelRequest) =>
            estimateBatimentsMachinesAgricoles(computedLevelRequest, context),
          ),
        )
        .with({ id: 'dechets_mode_de_traitement' }, (dechetsModeDeTraitementRequest) =>
          estimateOnComputedLevel(dechetsModeDeTraitementRequest, (computedLevelRequest) =>
            estimateDechetsModeDeTraitement(computedLevelRequest, context),
          ),
        )
        .with({ id: 'dechets_sobriete' }, (dechetsSobrieteRequest) =>
          estimateOnComputedLevel(dechetsSobrieteRequest, (computedLevelRequest) =>
            estimateDechetsSobriete(computedLevelRequest, context),
          ),
        )
        .with({ id: 'elevage_durable' }, (elevageDurableRequest) =>
          estimateOnComputedLevel(elevageDurableRequest, (computedLevelRequest) =>
            estimateElevageDurable(computedLevelRequest, context),
          ),
        )
        .with({ id: 'fertilisation_azotee' }, (fertilisationAzoteeRequest) =>
          estimateOnComputedLevel(fertilisationAzoteeRequest, (computedLevelRequest) =>
            estimateFertilisationAzotee(computedLevelRequest, context),
          ),
        )
        .with({ id: 'haies' }, (haiesRequest) => ok(estimateHaies(haiesRequest)))
        .with({ id: 'occupation_des_sols' }, (occupationDesSolsRequest) =>
          estimateOnComputedLevel(occupationDesSolsRequest, (computedLevelRequest) =>
            estimateOccupationDesSols(computedLevelRequest, context),
          ),
        )
        .with({ id: 'pratiques_stockantes' }, (pratiquesStockantesRequest) =>
          ok(estimatePratiquesStockantes(pratiquesStockantesRequest)),
        )
        .with({ id: 'produits_bois' }, (produitsBoisRequest) =>
          estimateOnComputedLevel(produitsBoisRequest, (computedLevelRequest) =>
            estimateProduitsBois(computedLevelRequest, context),
          ),
        )
        .with({ id: 'reseaux_chaleur' }, (reseauxChaleurRequest) =>
          estimateOnComputedLevel(reseauxChaleurRequest, (computedLevelRequest) =>
            estimateReseauxChaleur(computedLevelRequest, context),
          ),
        )
        .with(
          { id: 'residentiel_changement_systeme_chauffage' },
          (residentielChangementSystemeChauffageRequest) =>
            estimateOnComputedLevel(
              residentielChangementSystemeChauffageRequest,
              (computedLevelRequest) =>
                estimateResidentielChangementSystemeChauffage(computedLevelRequest, context),
            ),
        )
        .with({ id: 'residentiel_renovation' }, (residentielRenovationRequest) =>
          estimateOnComputedLevel(residentielRenovationRequest, (computedLevelRequest) =>
            estimateResidentielRenovation(computedLevelRequest, context),
          ),
        )
        .with({ id: 'residentiel_sobriete' }, (residentielSobrieteRequest) =>
          estimateOnComputedLevel(residentielSobrieteRequest, (computedLevelRequest) =>
            estimateResidentielSobriete(computedLevelRequest, context),
          ),
        )
        .with({ id: 'transport_marchandises_efficacite' }, (transportMarchandisesEfficaciteRequest) =>
          estimateOnComputedLevel(
            transportMarchandisesEfficaciteRequest,
            (computedLevelRequest) =>
              estimateTransportMarchandisesEfficacite(computedLevelRequest, context),
          ),
        )
        .with(
          { id: 'transport_marchandises_electrification' },
          (transportMarchandisesElectrificationRequest) =>
            estimateOnComputedLevel(
              transportMarchandisesElectrificationRequest,
              (computedLevelRequest) =>
                estimateTransportMarchandisesElectrification(computedLevelRequest, context),
            ),
        )
        .with({ id: 'transport_marchandises_report_modal' }, (transportMarchandisesReportModalRequest) =>
          estimateOnComputedLevel(
            transportMarchandisesReportModalRequest,
            (computedLevelRequest) =>
              estimateTransportMarchandisesReportModal(computedLevelRequest, context),
          ),
        )
        .with(
          { id: 'transport_marchandises_sobriete_logistique' },
          (transportMarchandisesSobrieteLogistiqueRequest) =>
            estimateOnComputedLevel(
              transportMarchandisesSobrieteLogistiqueRequest,
              (computedLevelRequest) =>
                estimateTransportMarchandisesSobrieteLogistique(computedLevelRequest, context),
            ),
        )
        .with({ id: 'transport_personnes_efficacite' }, (transportPersonnesEfficaciteRequest) =>
          estimateOnComputedLevel(transportPersonnesEfficaciteRequest, (computedLevelRequest) =>
            estimateTransportPersonnesEfficacite(computedLevelRequest, context),
          ),
        )
        .with(
          { id: 'transport_personnes_electrification' },
          (transportPersonnesElectrificationRequest) =>
            estimateOnComputedLevel(transportPersonnesElectrificationRequest, (computedLevelRequest) =>
              estimateTransportPersonnesElectrification(computedLevelRequest, context),
            ),
        )
        .with({ id: 'transport_personnes_report_modal' }, (transportPersonnesReportModalRequest) =>
          estimateOnComputedLevel(transportPersonnesReportModalRequest, (computedLevelRequest) =>
            estimateTransportPersonnesReportModal(computedLevelRequest, context),
          ),
        )
        .with(
          { id: 'transport_personnes_sobriete_deplacements' },
          (transportPersonnesSobrieteDeplacementsRequest) =>
            estimateOnComputedLevel(
              transportPersonnesSobrieteDeplacementsRequest,
              (computedLevelRequest) =>
                estimateTransportPersonnesSobrieteDeplacements(computedLevelRequest, context),
            ),
        )
        .exhaustive()
  }

  return estimate
}

export { createEstimator }
export type { Estimate, Estimator, Lever, RequestInput }
