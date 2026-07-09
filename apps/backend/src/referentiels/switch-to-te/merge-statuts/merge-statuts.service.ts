import { Injectable } from '@nestjs/common';
import ScoresService from '@tet/backend/referentiels/compute-score/scores.service';
import { success, type Result } from '@tet/backend/utils/result.type';
import {
  StatutAvancementEnum,
  type ActionStatutCreate,
} from '@tet/domain/referentiels';
import { type SwitchToTeContext } from '../shared/switch-to-te-context';
import { type SwitchToTeError } from '../switch-to-te.errors';
import { getPointPotentiel } from '../shared/origine-resolution';
import {
  deriveStatutFromProjection,
  toActionStatutCreate,
  type DerivedMergeStatut,
} from './merge-statuts.rules';

const SCORE_ROUNDING_DIGITS = 3;

@Injectable()
export class MergeStatutsService {
  constructor(private readonly scoresService: ScoresService) {}

  merge(
    ctx: SwitchToTeContext
  ): Result<ActionStatutCreate[], SwitchToTeError> {
    const actionStatuts: ActionStatutCreate[] = [];

    for (const cible of ctx.cibles.sousActionsEtTaches) {
      const tePointPotentiel = getPointPotentiel(
        ctx.teScoreMap,
        cible.actionId
      );

      let derivedStatut: DerivedMergeStatut;

      // l'action TE désactivée/non concernée prime sur la projection des sources
      if (!cible.concernee) {
        derivedStatut = { statut: StatutAvancementEnum.NON_CONCERNE };
      } else if (cible.originesConcernees.length === 0) {
        derivedStatut = deriveStatutFromProjection({
          concernedSourceCount: 0,
          pointFait: 0,
          pointProgramme: 0,
          pointPasFait: 0,
          pointPotentiel: tePointPotentiel,
        });
      } else {
        const ratio = this.scoresService.getRatioFromOrigineActions(
          cible.originesConcernees,
          tePointPotentiel
        );
        const projected = this.scoresService.getScoreFromOrigineActionsAndRatio(
          ratio,
          cible.originesConcernees,
          SCORE_ROUNDING_DIGITS,
          tePointPotentiel
        );

        derivedStatut = deriveStatutFromProjection({
          concernedSourceCount: cible.originesConcernees.length,
          pointFait: projected.pointFait ?? 0,
          pointProgramme: projected.pointProgramme ?? 0,
          pointPasFait: projected.pointPasFait ?? 0,
          pointPotentiel: tePointPotentiel,
        });
      }

      actionStatuts.push(
        toActionStatutCreate(ctx.collectiviteId, cible.actionId, derivedStatut)
      );
    }

    return success(actionStatuts);
  }
}
