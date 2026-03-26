'use client';
import { getPrevAndNextActionLinks } from '@/app/referentiels/actions/get-prev-and-next-action-links.utils';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useActionId } from '../../action-context';
import { useGetAction } from '../../use-get-action';
import ActionCommentsSidePanelContent from '../action-comments-side-panel-content';

export const useCommentPanel = () => {
  const { setPanel, setTitle, panel } = useSidePanel();
  const { collectiviteId } = useCurrentCollectivite();
  const parentActionId = useActionId();
  const parentAction = useGetAction({ actionId: parentActionId });

  console.log('parentAction', parentActionId);

  const closeCommentPanel = () => {
    setPanel({ type: 'close' });
  };

  const openCommentPanel = ({ action }: { action: ActionListItem }) => {
    const { prevActionLink, nextActionLink } = getPrevAndNextActionLinks({
      action,
      collectiviteId,
    });

    console.log('openCommentPanel', action.actionId);

    setPanel({
      type: 'open',
      isPersistentWithNextPath: (pathname) =>
        pathname === nextActionLink || pathname === prevActionLink,
      content: (
        <ActionCommentsSidePanelContent
          key={`${action.actionId}-${parentAction?.actionId}`}
          action={action}
          updateTitlePanel={(title: string) => {
            setTitle(title);
          }}
        />
      ),
    });
  };

  return {
    // action: parentAction,
    panel,
    openCommentPanel,
    closeCommentPanel,
  };
};
