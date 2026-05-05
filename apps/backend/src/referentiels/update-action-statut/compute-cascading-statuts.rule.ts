import {
  ActionStatutCreate,
  ActionTypeEnum,
  findActionById,
  getParentId,
  StatutAvancementEnum,
  TreeOfActionsIncludingScore,
} from '@tet/domain/referentiels';

/**
 * Statuts en cascade pour garder la cohérence sous-action / tâches :
 * tâche renseignée → le parent sous-action avec statut direct est remis à non_renseigne.
 */
export function computeCascadingParentStatuts(
  actionStatuts: ActionStatutCreate[],
  scoresTree: TreeOfActionsIncludingScore,
  collectiviteId: number
): ActionStatutCreate[] {
  const explicitActionIds = new Set(actionStatuts.map((s) => s.actionId));

  const findNode = (actionId: string) => {
    try {
      return findActionById(scoresTree, actionId);
    } catch {
      return undefined;
    }
  };

  const hasDirectStatus = (node: TreeOfActionsIncludingScore) =>
    node.score.avancement &&
    node.score.avancement !== StatutAvancementEnum.NON_RENSEIGNE;

  const makeResetStatut = (actionId: string): ActionStatutCreate => ({
    collectiviteId,
    actionId,
    statut: StatutAvancementEnum.NON_RENSEIGNE,
    statutDetailleAuPourcentage: null,
  });

  return actionStatuts
    .filter((s) => findNode(s.actionId)?.actionType === ActionTypeEnum.TACHE)
    .map((s) => getParentId({ actionId: s.actionId }))
    .filter((parentId): parentId is string => parentId !== null)
    .filter((parentId) => !explicitActionIds.has(parentId))
    .map((parentId) => ({ parentId, parent: findNode(parentId) }))
    .filter(
      ({ parent }) =>
        parent?.actionType === ActionTypeEnum.SOUS_ACTION &&
        hasDirectStatus(parent)
    )
    .map(({ parentId }) => makeResetStatut(parentId));
}

/**
 * Fusionne les statuts explicites avec les statuts en cascade.
 * Les statuts explicites ont toujours priorité sur les cascade.
 */
function mergeCascadingStatuts(
  explicit: ActionStatutCreate[],
  cascade: ActionStatutCreate[]
): ActionStatutCreate[] {
  const explicitIds = new Set(explicit.map((s) => s.actionId));
  const uniqueCascade = cascade.filter((s) => !explicitIds.has(s.actionId));
  return [...explicit, ...uniqueCascade];
}

export function computeAndMergeParentCascadingStatuts(
  actionStatuts: ActionStatutCreate[],
  scoresTree: TreeOfActionsIncludingScore,
  collectiviteId: number
): ActionStatutCreate[] {
  const cascadingParentStatuts = computeCascadingParentStatuts(
    actionStatuts,
    scoresTree,
    collectiviteId
  );

  return mergeCascadingStatuts(actionStatuts, cascadingParentStatuts);
}
