'use client';

import { type ActionDetailed } from '@/app/referentiels/use-snapshot';
import { DiscussionMessages } from '@/domain/collectivites';
import { ReferentielId } from '@/domain/referentiels';

/**
 * Recursively extracts all actionId and nom properties from actionsEnfant
 */
export const getActionsAndSubActionsIdIdentifiantAndName = (
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

  // Add current action if it has actionId and nom from action and sous-action
  if (
    (actionNode.actionType === 'action' ||
      actionNode.actionType === 'sous-action') &&
    actionNode.actionId &&
    actionNode.nom
  ) {
    result.push({
      actionId: actionNode.actionId,
      identifiant: actionNode.identifiant,
      nom: actionNode.nom,
    });
  }

  // Recursively process all children
  if (actionNode.actionsEnfant && Array.isArray(actionNode.actionsEnfant)) {
    actionNode.actionsEnfant.forEach((enfant: any) => {
      result.push(...getActionsAndSubActionsIdIdentifiantAndName(enfant));
    });
  }

  return result;
};

export const isSousMesure = (
  actionId: string,
  referentielId: ReferentielId
) => {
  if (actionId === 'all') {
    return false;
  }
  return referentielId === 'cae'
    ? actionId?.split('_')[1].length !== 5
    : actionId?.split('_')[1].length !== 3;
};

export const orderDiscussions = (
  orderBy: string,
  discussions: DiscussionMessages[]
): DiscussionMessages[] => {
  const sortedDiscussions = [...discussions];

  switch (orderBy) {
    case 'actionId':
      return sortedDiscussions.sort((a, b) =>
        a.actionId.localeCompare(b.actionId)
      );
    case 'createdAt':
      return sortedDiscussions.sort((a, b) => {
        const getMostRecentMessageDate = (disc: DiscussionMessages) => {
          if (!disc.messages || disc.messages.length === 0) {
            return disc.createdAt;
          }
          return disc.messages.reduce((latest, msg) => {
            return msg.createdAt > latest ? msg.createdAt : latest;
          }, disc.messages[0].createdAt);
        };
        const aLatest = getMostRecentMessageDate(a);
        const bLatest = getMostRecentMessageDate(b);
        return bLatest.localeCompare(aLatest);
      });
    case 'createdBy':
      return sortedDiscussions.sort((a, b) => {
        const getMainMessageCreator = (disc: DiscussionMessages) => {
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
        const aCreator = getMainMessageCreator(a);
        const bCreator = getMainMessageCreator(b);
        const creatorCompare = aCreator.localeCompare(bCreator);
        if (creatorCompare === 0) {
          return a.actionId.localeCompare(b.actionId);
        }
        return creatorCompare;
      });
    default:
      return sortedDiscussions;
  }
};
