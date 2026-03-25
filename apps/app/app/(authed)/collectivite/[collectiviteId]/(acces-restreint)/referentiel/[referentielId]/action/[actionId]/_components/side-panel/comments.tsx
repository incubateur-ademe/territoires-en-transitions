'use client';

import { useAction } from '@/app/referentiels/actions/action-context';
import { getActionsAndSubActions } from '@/app/referentiels/actions/comments/helpers/action-comments-helper';
import { ReferentielId } from '@tet/domain/referentiels';
import { ReactNode } from 'react';
import { ActionCommentsSidePanelContent } from '../comments/action-comments-side-panel-content';

export function CommentsPanelContent({
  referentielId,
  parentActionId,
  actionId,
  updateTitlePanel,
}: {
  referentielId: ReferentielId;
  parentActionId: string;
  actionId: string;
  updateTitlePanel: (title: string) => void;
}): ReactNode {
  const { data: action } = useAction();
  const actionsAndSubActions = getActionsAndSubActions(action);

  return (
    <ActionCommentsSidePanelContent
      parentActionId={parentActionId}
      actionId={actionId}
      referentielId={referentielId}
      actionsAndSubActionsTitleList={actionsAndSubActions}
      updateTitlePanel={updateTitlePanel}
    />
  );
}
