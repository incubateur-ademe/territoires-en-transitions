'use client';

import { FichesActionLiees } from '@/app/referentiels/action.show/FichesActionLiees';
import { useFichesActionLiees } from '@/app/referentiels/action.show/useFichesActionLiees';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { CellContext } from '@tanstack/react-table';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ActionType, ActionTypeEnum } from '@tet/domain/referentiels';
import { Button, cn, TableCell } from '@tet/ui';
import { useCallback } from 'react';

type Props = {
  info: CellContext<ActionListItem, unknown>;
};

function FichesCellContent({
  action,
  cellId,
}: {
  action: ActionListItem;
  cellId: string;
}) {
  const { collectiviteId } = useCurrentCollectivite();
  const { data: fiches } = useFichesActionLiees({
    actionId: action.actionId,
    collectiviteId,
  });
  const count = fiches.length;

  const { setPanel, panel } = useSidePanel();

  const panelKey = `fiches-${action.actionId}`;
  const isActive = panel.isOpen && panel.title === panelKey;

  const toggleFichesPanel = useCallback(() => {
    if (isActive) {
      setPanel({ type: 'close' });
      return;
    }

    setPanel({
      type: 'open',
      title: panelKey,
      Title: () => (
        <h5 className="text-primary-9 font-bold leading-7 text-xl">
          {action.identifiant} {action.nom}
        </h5>
      ),
      content: (
        <div className="px-6 py-4">
          <FichesActionLiees actionId={action.actionId} />
        </div>
      ),
    });
  }, [isActive, setPanel, panelKey, action]);

  return (
    <TableCell
      tabIndex={-1}
      data-cell-id={cellId}
      data-inline-edit="true"
      className="!text-center cursor-pointer"
      onClick={toggleFichesPanel}
    >
      <Button
        variant="grey"
        size="xs"
        icon="article-line"
        onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
          e.stopPropagation()
        }
        onClickCapture={toggleFichesPanel}
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

export const ReferentielTableFichesCell = ({ info }: Props) => {
  const data = info.row.original;
  const cellId = info.cell.id;

  if (ACTIONABLE_TYPES.has(data.actionType)) {
    return <FichesCellContent action={data} cellId={cellId} />;
  }

  return <TableCell tabIndex={-1} data-cell-id={cellId} />;
};
