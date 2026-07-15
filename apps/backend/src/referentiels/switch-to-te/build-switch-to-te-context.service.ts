import { Injectable } from '@nestjs/common';
import { FicheActionLinkRepository } from '@tet/backend/plans/fiches/update-fiche/fiche-action-link.repository';
import { buildScoreMapByActionId } from '@tet/backend/referentiels/compute-score/score-map.rules';
import ScoresService from '@tet/backend/referentiels/compute-score/scores.service';
import { GetReferentielDefinitionService } from '@tet/backend/referentiels/definitions/get-referentiel-definition/get-referentiel-definition.service';
import { GetReferentielService } from '@tet/backend/referentiels/get-referentiel/get-referentiel.service';
import { HandleMesurePilotesService } from '@tet/backend/referentiels/handle-mesure-pilotes/handle-mesure-pilotes.service';
import { HandleMesureServicesService } from '@tet/backend/referentiels/handle-mesure-services/handle-mesure-services.service';
import { SNAPSHOTS } from '@tet/backend/referentiels/snapshots/snapshots.constants';
import type { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import {
  type CollectiviteReferentielPreferences,
  type PersonneId,
  type PersonneTagOrUser,
  type TagWithCollectiviteId,
} from '@tet/domain/collectivites';
import {
  ReferentielIdEnum,
  type ActionScore,
  type ReferentielId,
  type ScoreSnapshot,
} from '@tet/domain/referentiels';
import {
  listMesuresCibles,
  listSousActionsEtTachesCibles,
} from './shared/action-cible';
import { collectMesureOrigineIds } from './shared/action-origine';
import { buildCorrespondanceIndexes } from './shared/correspondance-origine-cible';
import { type SwitchToTeContext } from './shared/switch-to-te-context';
import {
  SwitchToTeErrorEnum,
  type SwitchToTeError,
} from './switch-to-te.errors';

@Injectable()
export class BuildSwitchToTeContextService {
  private static readonly SOURCE_REFERENTIELS = [
    ReferentielIdEnum.CAE,
    ReferentielIdEnum.ECI,
  ] as const;

  constructor(
    private readonly scoresService: ScoresService,
    private readonly getReferentielService: GetReferentielService,
    private readonly getReferentielDefinitionService: GetReferentielDefinitionService,
    private readonly handleMesurePilotesService: HandleMesurePilotesService,
    private readonly handleMesureServicesService: HandleMesureServicesService,
    private readonly ficheActionLinkRepository: FicheActionLinkRepository
  ) {}

  async build(
    collectiviteId: number,
    prefs: CollectiviteReferentielPreferences,
    preSwitchSnapshots: ScoreSnapshot[],
    { user }: ServiceSecondArg
  ): Promise<Result<SwitchToTeContext, SwitchToTeError>> {
    const sourceReferentiels =
      BuildSwitchToTeContextService.SOURCE_REFERENTIELS.filter(
        (referentielId) => prefs[referentielId].mode === 'write'
      );

    const scoreMapsResult = this.buildScoreMapsFromPreSwitchSnapshots(
      collectiviteId,
      sourceReferentiels,
      preSwitchSnapshots
    );
    if (!scoreMapsResult.success) {
      return scoreMapsResult;
    }

    const referentielTe = await this.getReferentielService.getReferentielTree(
      ReferentielIdEnum.TE,
      true,
      true
    );

    const { scoresPayload } =
      await this.scoresService.computeScoreForCollectivite(
        ReferentielIdEnum.TE,
        collectiviteId,
        { avecReferentielsOrigine: false },
        user
      );

    const teScoreMap = buildScoreMapByActionId(scoresPayload.scores);
    const listCiblesInput = {
      referentielTe,
      scoreMapsByReferentiel: scoreMapsResult.data,
      teScoreMap,
    };
    const mesures = listMesuresCibles(listCiblesInput);
    const sousActionsEtTaches = listSousActionsEtTachesCibles(listCiblesInput);
    const hierarchiesByReferentielId =
      await this.getReferentielDefinitionService.getHierarchiesByReferentielIds(
        sourceReferentiels
      );
    const correspondanceIndexes = buildCorrespondanceIndexes({
      sousActionsEtTaches,
      mesures,
      hierarchiesByReferentielId,
    });
    const mesureSourceIds = collectMesureOrigineIds(
      mesures
        .filter((cible) => cible.concernee)
        .flatMap((cible) =>
          cible.originesConcernees.map((origine) => ({
            referentielId: origine.referentielId as ReferentielId,
            actionId: origine.actionId,
          }))
        ),
      hierarchiesByReferentielId
    );
    const pilotesByMesureActionId = await this.loadPilotesByMesureActionId(
      collectiviteId,
      mesureSourceIds
    );
    const servicesByMesureActionId = await this.loadServicesByMesureActionId(
      collectiviteId,
      mesureSourceIds
    );
    const sourceFicheLinks =
      await this.ficheActionLinkRepository.listLinksForCollectivite(
        collectiviteId,
        sourceReferentiels
      );

    return success({
      collectiviteId,
      sourceReferentiels,
      scoreMapsByReferentiel: scoreMapsResult.data,
      referentielTe,
      teScoreMap,
      hierarchiesByReferentielId,
      pilotesByMesureActionId,
      servicesByMesureActionId,
      correspondanceIndexes,
      cibles: {
        sousActionsEtTaches,
        mesures,
      },
      sourceFicheLinks,
    });
  }

  private async loadPilotesByMesureActionId(
    collectiviteId: number,
    mesureSourceIds: Set<string>
  ): Promise<Map<string, PersonneId[]>> {
    if (mesureSourceIds.size === 0) {
      return new Map();
    }

    const pilotesRecord = await this.handleMesurePilotesService.listPilotes(
      collectiviteId,
      [...mesureSourceIds]
    );

    return new Map(
      Object.entries(pilotesRecord).map(([actionId, pilotes]) => [
        actionId,
        this.toPersonneIds(pilotes),
      ])
    );
  }

  private async loadServicesByMesureActionId(
    collectiviteId: number,
    mesureSourceIds: Set<string>
  ): Promise<Map<string, number[]>> {
    if (mesureSourceIds.size === 0) {
      return new Map();
    }

    const servicesRecord = await this.handleMesureServicesService.listServices(
      collectiviteId,
      [...mesureSourceIds]
    );

    return new Map(
      Object.entries(servicesRecord).map(([actionId, services]) => [
        actionId,
        this.toServiceTagIds(services),
      ])
    );
  }

  private toServiceTagIds(services: TagWithCollectiviteId[]): number[] {
    return services.map((service) => service.id);
  }

  private toPersonneIds(pilotes: PersonneTagOrUser[]): PersonneId[] {
    return pilotes
      .filter((pilote) => pilote.userId != null || pilote.tagId != null)
      .map((pilote) => ({
        userId: pilote.userId ?? null,
        tagId: pilote.tagId ?? null,
      }));
  }

  private buildScoreMapsFromPreSwitchSnapshots(
    collectiviteId: number,
    sourceReferentiels: ReferentielId[],
    preSwitchSnapshots: ScoreSnapshot[]
  ): Result<Map<ReferentielId, Map<string, ActionScore>>, SwitchToTeError> {
    const snapshotsByReferentielId = new Map(
      preSwitchSnapshots
        .filter((snapshot) => snapshot.ref === SNAPSHOTS.PRE_SWITCH_TE_REF)
        .map((snapshot) => [snapshot.referentielId, snapshot] as const)
    );

    const scoreMapsByReferentiel = new Map<
      ReferentielId,
      Map<string, ActionScore>
    >();

    for (const referentielId of sourceReferentiels) {
      const snapshot = snapshotsByReferentielId.get(referentielId);

      if (!snapshot || snapshot.collectiviteId !== collectiviteId) {
        return failure(SwitchToTeErrorEnum.PRE_SWITCH_SNAPSHOT_MISSING);
      }

      scoreMapsByReferentiel.set(
        referentielId,
        buildScoreMapByActionId(snapshot.scoresPayload.scores)
      );
    }

    return success(scoreMapsByReferentiel);
  }
}
