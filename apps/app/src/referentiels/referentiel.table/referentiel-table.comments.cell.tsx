'use client';

import { ActionProvider } from '@/app/referentiels/actions/action-context';
import { ActionCommentsSidePanelContent } from '@/app/referentiels/actions/comments/action-comments-side-panel-content';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { ReferentielProvider } from '@/app/referentiels/referentiel-context';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { CellContext } from '@tanstack/react-table';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  ActionType,
  ActionTypeEnum,
  getReferentielIdFromActionId,
} from '@tet/domain/referentiels';
import { Button, cn, TableCell } from '@tet/ui';
import { useCallback, useMemo } from 'react';
import { getTableMeta } from './utils';

type Props = {
  info: CellContext<ActionListItem, unknown>;
};

function CommentsCellContent({
  info,
  action,
  cellId,
}: {
  info: CellContext<ActionListItem, unknown>;
  action: ActionListItem;
  cellId: string;
}) {
  const referentielId = getReferentielIdFromActionId(action.actionId);
  const { commentsByActionId = {} } = getTableMeta(info.table);

  const rootMessagesCount =
    commentsByActionId[action.actionId]?.reduce(
      (total, comment) => total + comment.messages.length,
      0
    ) ?? 0;

  const messagesCount = useMemo(
    () =>
      action.childrenIds.reduce((total, childId) => {
        return (
          total +
          (commentsByActionId[childId]?.reduce(
            (total, comment) => total + comment.messages.length,
            0
          ) ?? 0)
        );
      }, rootMessagesCount),
    [action.childrenIds, commentsByActionId, rootMessagesCount]
  );

  const { setPanel, setTitle, panel } = useSidePanel();

  const panelKey = `comments-${action.actionId}`;
  const isActive = panel.isOpen && panel.title === panelKey;

  const toggleCommentsPanel = useCallback(() => {
    if (isActive) {
      setPanel({ type: 'close' });
      return;
    }

    setPanel({
      type: 'open',
      title: panelKey,
      Title: () => (
        <h5 className="text-primary-9 font-bold leading-7 text-xl">
          Commentaires
        </h5>
      ),
      content: (
        <div className="px-6 py-4">
          <ReferentielProvider referentielId={referentielId}>
            <ActionProvider actionId={action.actionId}>
              <ActionCommentsSidePanelContent
                action={action}
                updateTitlePanel={(title: string) => {
                  setTitle(title);
                }}
              />
            </ActionProvider>
          </ReferentielProvider>
        </div>
      ),
    });
  }, [isActive, setPanel, panelKey, referentielId, action, setTitle]);

  return (
    <TableCell
      tabIndex={-1}
      data-cell-id={cellId}
      data-inline-edit="true"
      className="!text-center cursor-pointer"
      onClick={toggleCommentsPanel}
    >
      <Button
        variant="grey"
        size="xs"
        icon="discuss-line"
        onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
          e.stopPropagation()
        }
        onClickCapture={toggleCommentsPanel}
        aria-pressed={isActive}
        className={cn(
          isActive
            ? 'bg-primary-9 hover:!bg-primary-9 text-white hover:!text-white'
            : 'text-grey-8 border-grey-4'
        )}
      >
        {messagesCount}
      </Button>
    </TableCell>
  );
}

const ACTIONABLE_TYPES = new Set<ActionType>([
  ActionTypeEnum.ACTION,
  ActionTypeEnum.SOUS_ACTION,
]);

export const ReferentielTableCommentsCell = ({ info }: Props) => {
  const data = info.row.original;
  const cellId = info.cell.id;
  const { hasCollectivitePermission } = useCurrentCollectivite();
  const canReadComments = hasCollectivitePermission(
    'referentiels.discussions.read'
  );

  if (ACTIONABLE_TYPES.has(data.actionType) && canReadComments) {
    return <CommentsCellContent info={info} action={data} cellId={cellId} />;
  }

  return <TableCell tabIndex={-1} data-cell-id={cellId} />;
};
