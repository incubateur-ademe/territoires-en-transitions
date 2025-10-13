'use client';
import { useAction } from '@/app/referentiels/actions/action-context';
import { usePrevAndNextActionLinks } from '@/app/referentiels/actions/use-prev-and-next-action-links';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { ReferentielId } from '@/domain/referentiels';
import ActionCommentsPanel from '../action-comments.panel';

/**
 * Recursively extracts all actionId and nom properties from actionsEnfant
 */
export const getActionsAndSubActionsIdIdentifiantAndName = (
  actionNode: any
): Array<{ actionId: string; identifiant: string; nom: string }> => {
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

export const useCommentPanel = (
  referentielId: ReferentielId,
  parentActionId: string
) => {
  const { setPanel, setTitle, panel } = useSidePanel();

  const { data: action, isLoading } = useAction();

  const { prevActionLink, nextActionLink } = usePrevAndNextActionLinks(
    action?.actionId ?? ''
  );

  const actionsAndSubActionsIdIdentifiantAndName =
    getActionsAndSubActionsIdIdentifiantAndName(action);

  const closePanel = () => {
    setPanel({ type: 'close' });
  };

  const updateDiscussionCount = (count: number) => {
    setTitle(`${count} Commentaires`);
  };

  const openPanel = (actionId: string) => {
    setPanel({
      type: 'open',
      isPersistentWithNextPath: (pathname) =>
        pathname === nextActionLink || pathname === prevActionLink,
      title: `Commentaires`,
      content: (
        <ActionCommentsPanel
          parentActionId={parentActionId}
          actionId={actionId}
          referentielId={referentielId}
          actionsAndSubActionsIdIdentifiantAndName={
            actionsAndSubActionsIdIdentifiantAndName
          }
          updateDiscussionCount={(count: number) => {
            updateDiscussionCount(count);
          }}
        />
      ),
    });
  };

  return {
    action,
    panel,
    isLoading,
    openPanel,
    closePanel,
  };
};
