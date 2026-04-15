'use client';

import { DownloadDocs } from '@/app/referentiels/actions/action-documents.download-button';
import ActionPreuvePanel from '@/app/referentiels/actions/action-preuve.panel';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { useActionPreuvesCount } from '@/app/referentiels/preuves/usePreuves';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { ActionType, ActionTypeEnum } from '@tet/domain/referentiels';
import { Button, cn, TableCell } from '@tet/ui';
import { CellContext } from '@tanstack/react-table';
import { useCallback } from 'react';

type Props = {
  info: CellContext<ActionListItem, unknown>;
};

function DocumentsCellContent({
  action,
  cellId,
}: {
  action: ActionListItem;
  cellId: string;
}) {
  const count = useActionPreuvesCount(action.actionId);
  const { setPanel, panel } = useSidePanel();

  const isActive =
    panel.isOpen && panel.title === `documents-${action.actionId}`;

  const toggleDocumentsPanel = useCallback(() => {
    if (isActive) {
      setPanel({ type: 'close' });
      return;
    }

    setPanel({
      type: 'open',
      title: `documents-${action.actionId}`,
      Title: () => (
        <h5 className="text-primary-9 font-bold leading-7 text-xl">
          {action.identifiant} {action.nom}
        </h5>
      ),
      content: (
        <div className="px-6 py-4">
          <section className="flex flex-col gap-5">
            <DownloadDocs action={action} />
            <ActionPreuvePanel
              withSubActions
              showWarning
              displayInPanel
              action={action}
            />
          </section>
        </div>
      ),
    });
  }, [isActive, setPanel, action]);

  return (
    <TableCell
      tabIndex={-1}
      data-cell-id={cellId}
      data-inline-edit="true"
      className="!text-center cursor-pointer"
      onClick={toggleDocumentsPanel}
    >
      <Button
        variant="grey"
        size="xs"
        icon="file-line"
        onClick={(e) => e.stopPropagation()}
        onClickCapture={toggleDocumentsPanel}
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

const ACTIONABLE_TYPES = new Set<ActionType>([
  ActionTypeEnum.ACTION,
  ActionTypeEnum.SOUS_ACTION,
]);

export const ReferentielTableDocumentsCell = ({ info }: Props) => {
  const data = info.row.original;
  const cellId = info.cell.id;

  if (ACTIONABLE_TYPES.has(data.actionType)) {
    return <DocumentsCellContent action={data} cellId={cellId} />;
  }

  return <TableCell tabIndex={-1} data-cell-id={cellId} />;
};
