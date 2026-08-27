import { type CorrelatedAction } from '@tet/backend/referentiels/correlated-actions/referentiel-action-origine.dto';
import { type ReferentielResponse } from '@tet/backend/referentiels/get-referentiel/get-referentiel.service';
import {
  ActionTypeEnum,
  flatMapActionsEnfants,
  type ActionScore,
  type ReferentielId,
} from '@tet/domain/referentiels';
import { type CorrelatedActionTexte } from '../../correlated-actions/referentiel-action-origine-texte.dto';
import { CorrelatedActionWithScore } from '../../correlated-actions/referentiel-action-origine-with-score.dto';
import {
  buildCorrelatedActionsWithScore,
  dedupeOrigines,
  filterOriginesConcernees,
} from './action-origine';

/** Source d'une origine utilisée pour la fusion des commentaires (action_origine ou action_origine_texte) */
export type CommentaireOrigine = {
  referentielId: ReferentielId;
  actionId: string;
  nom: string | null;
};

/**
 * Action destination de la bascule + origines résolues depuis les snapshots pre-switch-te.
 * Artefact runtime backend — ne pas confondre avec ActionOrigine (entité BDD @tet/domain).
 */
export type ActionCible = {
  actionId: string;
  /** false si désactivée / non concernée par personnalisation TE */
  concernee: boolean;
  /** origines brutes (ordre arbre) — pour tri CAE puis ECI côté rules */
  actionsOrigine: CorrelatedAction[];
  /** origines avec score snapshot + filtre concerne !== false */
  originesConcernees: CorrelatedActionWithScore[];
  /**
   * source des commentaires uniquement : action_origine_texte si renseigné pour cette
   * cible (tout ou rien, sans repli même si le filtre "concerné" réduit à [] ensuite),
   * sinon égal à `originesConcernees`. Ne doit être lu que par mergeCommentaires
   * (via `ctx.cibles.commentaires` / `listCommentaireCibles`) —
   * mergeStatuts/mergePilotes/mergeServices restent sur `originesConcernees`.
   */
  originesCommentaire: CommentaireOrigine[];
};

export const isCibleConcernee = (
  teScoreMap: Map<string, ActionScore>,
  actionId: string
): boolean => {
  const score = teScoreMap.get(actionId);
  if (!score) {
    return true;
  }

  return score.concerne !== false;
};

export const getPointPotentiel = (
  scoreMap: Map<string, ActionScore>,
  actionId: string
): number => {
  const score = scoreMap.get(actionId);
  return score?.pointPotentiel ?? score?.pointReferentiel ?? 0;
};

const buildActionCible = (
  actionId: string,
  actionsOrigine: CorrelatedAction[],
  scoreMapsByReferentiel: Map<ReferentielId, Map<string, ActionScore>>,
  teScoreMap: Map<string, ActionScore>,
  actionsOrigineTexte: CorrelatedActionTexte[] = []
): ActionCible => {
  const correlatedActions = buildCorrelatedActionsWithScore(
    actionsOrigine,
    scoreMapsByReferentiel
  );

  const originesConcernees = filterOriginesConcernees(
    correlatedActions,
    scoreMapsByReferentiel
  );

  const originesCommentaire: CommentaireOrigine[] =
    actionsOrigineTexte.length > 0
      ? filterOriginesConcernees(
          buildCorrelatedActionsWithScore(
            actionsOrigineTexte,
            scoreMapsByReferentiel
          ),
          scoreMapsByReferentiel
        )
      : originesConcernees;

  return {
    actionId,
    concernee: isCibleConcernee(teScoreMap, actionId),
    actionsOrigine,
    originesConcernees,
    originesCommentaire,
  };
};

export const listSousActionsEtTachesCibles = (input: {
  referentielTe: ReferentielResponse;
  scoreMapsByReferentiel: Map<ReferentielId, Map<string, ActionScore>>;
  teScoreMap: Map<string, ActionScore>;
}): ActionCible[] => {
  const teActionsWithOrigine = flatMapActionsEnfants(
    input.referentielTe.itemsTree
  ).filter(
    (action) =>
      (action.actionType === ActionTypeEnum.SOUS_ACTION ||
        action.actionType === ActionTypeEnum.TACHE) &&
      (action.actionsOrigine?.length ?? 0) > 0
  );

  return teActionsWithOrigine.map((teAction) =>
    buildActionCible(
      teAction.actionId,
      teAction.actionsOrigine ?? [],
      input.scoreMapsByReferentiel,
      input.teScoreMap,
      teAction.actionsOrigineTexte ?? []
    )
  );
};

/**
 * Cibles pour la fusion des commentaires uniquement.
 *
 * Contrairement à `listSousActionsEtTachesCibles` (taillé pour `mergeStatuts` :
 * uniquement `SOUS_ACTION | TACHE` avec au moins une `action_origine`), on retient
 * ici **tous les niveaux** (action / sous-action / tâche) dès qu'une origine
 * exploitable existe : `action_origine` **ou** `action_origine_texte`.
 *
 * C'est ce qui permet de prendre en compte les liens `action_origine_texte` de
 * niveau action (ex. `cae_1.1.2 -> te_1.1.1`), ainsi que les sous-actions qui n'ont
 * qu'un lien `action_origine_texte` sans `action_origine`.
 */
export const listCommentaireCibles = (input: {
  referentielTe: ReferentielResponse;
  scoreMapsByReferentiel: Map<ReferentielId, Map<string, ActionScore>>;
  teScoreMap: Map<string, ActionScore>;
}): ActionCible[] =>
  flatMapActionsEnfants(input.referentielTe.itemsTree)
    .filter(
      (action) =>
        (action.actionsOrigine?.length ?? 0) > 0 ||
        (action.actionsOrigineTexte?.length ?? 0) > 0
    )
    .map((action) =>
      buildActionCible(
        action.actionId,
        action.actionsOrigine ?? [],
        input.scoreMapsByReferentiel,
        input.teScoreMap,
        action.actionsOrigineTexte ?? []
      )
    );

export const listMesuresCibles = (input: {
  referentielTe: ReferentielResponse;
  scoreMapsByReferentiel: Map<ReferentielId, Map<string, ActionScore>>;
  teScoreMap: Map<string, ActionScore>;
}): ActionCible[] => {
  const mesures = flatMapActionsEnfants(input.referentielTe.itemsTree).filter(
    (action) => action.actionType === ActionTypeEnum.ACTION
  );

  return mesures.flatMap((mesure) => {
    const subtree = flatMapActionsEnfants(mesure);
    const actionsOrigine = dedupeOrigines(
      subtree.flatMap((node) => node.actionsOrigine ?? [])
    );

    if (actionsOrigine.length === 0) {
      return [];
    }

    return [
      buildActionCible(
        mesure.actionId,
        actionsOrigine,
        input.scoreMapsByReferentiel,
        input.teScoreMap
      ),
    ];
  });
};
