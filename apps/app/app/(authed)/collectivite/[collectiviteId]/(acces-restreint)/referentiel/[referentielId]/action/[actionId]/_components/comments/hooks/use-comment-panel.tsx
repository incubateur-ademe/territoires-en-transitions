'use client';
import { useAction } from '@/app/referentiels/actions/action-context';
import { usePrevAndNextActionLinks } from '@/app/referentiels/actions/use-prev-and-next-action-links';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { ReferentielId } from '@/domain/referentiels';
import ActionCommentsPanel from '../action-comments.panel';
import { getActionsAndSubActionsIdIdentifiantAndName } from '../helpers/action-sub-action-list-helper';

export const useCommentPanel = (
  referentielId: ReferentielId,
  parentActionId: string
) => {
  const { setPanel, setTitle, panel } = useSidePanel();

  const { data: action, isLoading } = useAction();

  const { prevActionLink, nextActionLink } = usePrevAndNextActionLinks(
    action?.actionId ?? ''
  );

  const actionsAndSubActionsTitleList =
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
          actionsAndSubActionsTitleList={actionsAndSubActionsTitleList}
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
