'use client';
import { getPrevAndNextActionLinks } from '@/app/referentiels/actions/get-prev-and-next-action-links.utils';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ActionCommentsSidePanelContent } from '../action-comments-side-panel-content';

export const useCommentPanel = () => {
  const { setPanel, setTitle, panel } = useSidePanel();
  const { collectiviteId } = useCurrentCollectivite();
  const searchParams = useSearchParams();
  const [openedActionId, setOpenedActionId] = useState<string | undefined>(
    undefined
  );

  const closeCommentPanel = () => {
    setPanel({ type: 'close' });
  };

  const openCommentPanel = ({ action }: { action: ActionListItem }) => {
    const { prevActionLink, nextActionLink } = getPrevAndNextActionLinks({
      action,
      collectiviteId,
      searchParams,
    });

    setPanel({
      type: 'open',
      isPersistentWithNextPath: (pathname) =>
        pathname === nextActionLink || pathname === prevActionLink,
      content: (
        <ActionCommentsSidePanelContent
          // key={`${action.actionId}`}
          action={action}
          updateTitlePanel={(title: string) => {
            setTitle(title);
          }}
        />
      ),
    });

    setOpenedActionId(action.actionId);
  };

  return {
    openedActionId,
    panel,
    openCommentPanel,
    closeCommentPanel,
  };
};
