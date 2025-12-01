import { makeReferentielActionUrl } from '@/app/app/paths';
import { type ActionDetailed } from '@/app/referentiels/use-snapshot';
import { hasPermission } from '@/app/users/authorizations/permission-access-level.utils';
import {
  discussionOrderByEnum,
  discussionStatus,
  DiscussionWithMessages,
} from '@tet/domain/collectivites';
import {
  isSousMesure as isSousMesureDomain,
  ReferentielId,
} from '@tet/domain/referentiels';
import { CollectiviteAccess } from '@tet/domain/users';

/**
 * Recursively extracts all actionId and nom properties from actionsEnfant
 */
export const getActionsAndSubActions = (
  actionNode: ActionDetailed | undefined
): Array<{
  actionId: string;
  identifiant: string;
  nom: string;
}> => {
  if (!actionNode) return [];
  const result: Array<{
    actionId: string;
    identifiant: string;
    nom: string;
  }> = [];
  if (
    (actionNode.actionType === 'action' ||
      actionNode.actionType === 'sous-action') &&
    actionNode.actionId &&
    actionNode.nom
  ) {
    result.push({
      actionId: actionNode.actionId,
      identifiant: actionNode.identifiant || actionNode.actionId.split('_')[1],
      nom: actionNode.nom,
    });
  }
  if (actionNode.actionsEnfant && Array.isArray(actionNode.actionsEnfant)) {
    actionNode.actionsEnfant.forEach((enfant) => {
      result.push(...getActionsAndSubActions(enfant));
    });
  }

  return result;
};

export const isSousMesure = (
  actionId: string,
  referentielId: ReferentielId
) => {
  return (
    isSousMesureDomain(actionId, referentielId) &&
    actionId !== discussionStatus.ALL
  );
};

const getMostRecentMessage = (disc: DiscussionWithMessages) => {
  if (!disc.messages || disc.messages.length === 0) {
    return disc.createdAt;
  }

  return disc.messages.reduce((latest, msg) => {
    return msg.createdAt > latest ? msg.createdAt : latest;
  }, disc.messages[0].createdAt);
};

const getMainMessageCreator = (disc: DiscussionWithMessages) => {
  const mainMessage = disc.messages?.reduce((oldest, msg) =>
    msg.createdAt < oldest.createdAt ? msg : oldest
  );
  return (
    mainMessage?.createdByNom ??
    mainMessage?.createdByPrenom ??
    mainMessage?.createdBy ??
    ''
  );
};

const sortByCreator = (
  a: DiscussionWithMessages,
  b: DiscussionWithMessages
) => {
  const aCreator = getMainMessageCreator(a);
  const bCreator = getMainMessageCreator(b);
  const creatorCompare = aCreator.localeCompare(bCreator);
  if (creatorCompare === 0) {
    return a.actionId.localeCompare(b.actionId);
  }
  return creatorCompare;
};

const sortByCreatedAt = (
  a: DiscussionWithMessages,
  b: DiscussionWithMessages
) => {
  const aLatest = getMostRecentMessage(a);
  const bLatest = getMostRecentMessage(b);
  return bLatest.localeCompare(aLatest);
};

export const sortDiscussions = (
  orderBy: string,
  discussions: DiscussionWithMessages[]
): DiscussionWithMessages[] => {
  const sortedDiscussions = [...discussions];

  switch (orderBy) {
    case discussionOrderByEnum.ACTION_ID:
      return sortedDiscussions.sort((a, b) =>
        a.actionId.localeCompare(b.actionId)
      );
    case discussionOrderByEnum.CREATED_AT:
      return sortedDiscussions.sort(sortByCreatedAt);
    case discussionOrderByEnum.CREATED_BY:
      return sortedDiscussions.sort(sortByCreator);
    default:
      return sortedDiscussions;
  }
};

export const canCreateDiscussion = (
  currentCollectivite: CollectiviteAccess
) => {
  return hasPermission(
    currentCollectivite.permissions,
    'referentiels.discussions.mutate'
  );
};

export const buildActionLink = (
  actionId: string,
  referentielId: ReferentielId,
  collectiviteId: number
) => {
  const actionIdToLink = isSousMesure(actionId, referentielId)
    ? actionId.split('.').slice(0, -1).join('.')
    : actionId;
  return `${makeReferentielActionUrl({
    collectiviteId,
    referentielId,
    actionId: actionIdToLink,
  })}#${actionId}`;
};
