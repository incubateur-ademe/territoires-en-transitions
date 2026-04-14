'use client';

import { ActionCommentsSidePanelContent } from '@/app/referentiels/actions/comments/action-comments-side-panel-content';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';

import { ReactNode } from 'react';

export function CommentsPanelContent({
  action,
  updateTitlePanel,
}: {
  action: ActionListItem;
  updateTitlePanel: (title: string) => void;
}): ReactNode {
  return (
    <ActionCommentsSidePanelContent
      action={action}
      updateTitlePanel={updateTitlePanel}
    />
  );
}
