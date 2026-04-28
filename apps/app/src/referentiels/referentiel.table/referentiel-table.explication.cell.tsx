import { CellContext } from '@tanstack/react-table';
import { ActionType, ActionTypeEnum } from '@tet/domain/referentiels';
import { TableCell, TableCellRichTextEditor } from '@tet/ui';
import { ActionListItem } from '../actions/use-list-actions';
import { getTableMeta } from './utils';

type Props = {
  info: CellContext<ActionListItem, unknown>;
};

const actionTypesWithExplication = new Set<ActionType>([
  ActionTypeEnum.SOUS_ACTION,
  ActionTypeEnum.TACHE,
]);

export const ReferentielTableExplicationCell = ({
  info,
}: Props) => {
  const action = info.row.original;
  const cellId = info.cell.id;

  if (!actionTypesWithExplication.has(action.actionType)) {
    return <TableCell tabIndex={-1} data-cell-id={cellId} />;
  }

  const {
    actionId,
    score: { explication },
  } = action;

  const {
    collectiviteId,
    permissions: { canMutateReferentiel },
    updateActionExplication,
  } = getTableMeta(info.table);

  return (
    <TableCellRichTextEditor
      tabIndex={-1}
      data-cell-id={cellId}
      canEdit={canMutateReferentiel}
      placeholder="Ajouter un état d'avancement"
      initialValue={explication}
      onValueChange={(value) => {
        if (value === explication) {
          return;
        }

        updateActionExplication({
          actionId,
          collectiviteId,
          commentaire: value || '',
        });
      }}
    />
  );
};
