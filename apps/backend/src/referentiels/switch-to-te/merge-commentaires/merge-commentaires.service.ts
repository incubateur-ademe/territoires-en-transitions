import { Injectable } from '@nestjs/common';
import { success, type Result } from '@tet/backend/utils/result.type';
import {
  type ActionCommentaireCreate,
  type ReferentielId,
} from '@tet/domain/referentiels';
import { ActionCible } from '../shared/action-cible';
import { type SwitchToTeContext } from '../shared/switch-to-te-context';
import { type SwitchToTeError } from '../switch-to-te.errors';
import {
  formatSourceScoreLabel,
  isExplicationNonVide,
  mergeCommentairesFromSources,
  type MergeCommentaireSource,
} from './merge-commentaires.rules';

@Injectable()
export class MergeCommentairesService {
  merge(
    ctx: SwitchToTeContext
  ): Result<ActionCommentaireCreate[], SwitchToTeError> {
    const actionCommentaires: ActionCommentaireCreate[] = [];

    for (const cible of ctx.cibles.sousActionsEtTaches) {
      const sources = this.buildSourcesFromCible(ctx, cible.originesConcernees);
      const commentaire = mergeCommentairesFromSources(sources);

      if (commentaire === null) {
        continue;
      }

      actionCommentaires.push({
        collectiviteId: ctx.collectiviteId,
        actionId: cible.actionId,
        commentaire,
      });
    }

    return success(actionCommentaires);
  }

  private buildSourcesFromCible(
    ctx: SwitchToTeContext,
    originesConcernees: ActionCible['originesConcernees']
  ): MergeCommentaireSource[] {
    const sources: MergeCommentaireSource[] = [];

    for (const origine of originesConcernees) {
      const scoreMap = ctx.scoreMapsByReferentiel.get(
        origine.referentielId as ReferentielId
      );
      const actionScore = scoreMap?.get(origine.actionId);
      const explication = actionScore?.explication;

      if (!explication || !isExplicationNonVide(explication)) {
        continue;
      }

      sources.push({
        referentielId: origine.referentielId as ReferentielId,
        origineActionId: origine.actionId,
        nom: origine.nom,
        scoreLabel: formatSourceScoreLabel(actionScore),
        explication,
      });
    }

    return sources;
  }
}
