'use client';

import { ActionCommentsSidePanelContent } from '@/app/referentiels/actions/comments/action-comments-side-panel-content';
import { useListDiscussions } from '@/app/referentiels/actions/comments/hooks/use-list-discussions';
import { ActionProvider } from '@/app/referentiels/actions/action-context';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { ReferentielProvider } from '@/app/referentiels/referentiel-context';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import {
  ActionTypeEnum,
  getReferentielIdFromActionId,
} from '@tet/domain/referentiels';
import { Button, cn, TableCell } from '@tet/ui';
import { CellContext } from '@tanstack/react-table';
import { useCallback, useMemo } from 'react';

type Props = {
  info: CellContext<ActionListItem, unknown>;
};

function CommentsCellContent({
  action,
  cellId,
}: {
  action: ActionListItem;
  cellId: string;
}) {
  const referentielId = getReferentielIdFromActionId(action.actionId);
  const { data: discussionsData } = useListDiscussions(referentielId, {
    actionId: action.actionId,
  });

  const count = useMemo(
    () =>
      discussionsData?.discussions
        .filter((d) => d.status === 'ouvert')
        .reduce((acc, d) => acc + d.messages.length, 0) ?? 0,
    [discussionsData]
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
        onClick={(e) => e.stopPropagation()}
        onClickCapture={toggleCommentsPanel}
        aria-pressed={isActive}
        className={cn(
          isActive
            ? 'bg-primary-9 hover:!bg-primary-9 text-white hover:!text-white'
            : 'text-grey-8 border-grey-4'
        )}
      >
        {count}
      </Button>
    </TableCell>
  );
}

const ACTIONABLE_TYPES = new Set([
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
    return <CommentsCellContent action={data} cellId={cellId} />;
  }

  return <TableCell tabIndex={-1} data-cell-id={cellId} />;
};
