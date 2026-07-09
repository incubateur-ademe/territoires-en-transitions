import { Injectable } from '@nestjs/common';
import { buildScoreMapByActionId } from '@tet/backend/referentiels/compute-score/score-map.rules';
import ScoresService from '@tet/backend/referentiels/compute-score/scores.service';
import { GetReferentielService } from '@tet/backend/referentiels/get-referentiel/get-referentiel.service';
import { SNAPSHOTS } from '@tet/backend/referentiels/snapshots/snapshots.constants';
import type { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { type CollectiviteReferentielPreferences } from '@tet/domain/collectivites';
import {
  ReferentielIdEnum,
  type ActionScore,
  type ReferentielId,
  type ScoreSnapshot,
} from '@tet/domain/referentiels';
import { listActionCiblesSousActionsEtTaches } from './shared/action-cible';
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
    private readonly getReferentielService: GetReferentielService
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
    const cibles = {
      sousActionsEtTaches: listActionCiblesSousActionsEtTaches({
        referentielTe,
        scoreMapsByReferentiel: scoreMapsResult.data,
        teScoreMap,
      }),
    };

    return success({
      collectiviteId,
      sourceReferentiels,
      scoreMapsByReferentiel: scoreMapsResult.data,
      referentielTe,
      teScoreMap,
      cibles,
    });
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
