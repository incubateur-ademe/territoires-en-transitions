import { CellContext } from '@tanstack/react-table';
import { ActionType, ActionTypeEnum } from '@tet/domain/referentiels';
import { TableCell, TableCellRichTextEditor } from '@tet/ui';
import { ActionListItem } from '../actions/use-list-actions';
import { useUpdateActionExplication } from '../actions/use-update-action-explication';
import { getTableMeta } from './utils';

type Props = {
  info: CellContext<ActionListItem, unknown>;
  canEdit: boolean;
  updateActionExplication: ReturnType<
    typeof useUpdateActionExplication
  >['mutate'];
};

const actionTypesWithExplication = new Set<ActionType>([
  ActionTypeEnum.SOUS_ACTION,
  ActionTypeEnum.TACHE,
]);

export const ReferentielTableExplicationCell = ({
  info,
  canEdit,
  updateActionExplication,
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

  const { collectiviteId } = getTableMeta(info.table);

  return (
    <TableCellRichTextEditor
      tabIndex={-1}
      data-cell-id={cellId}
      canEdit={canEdit}
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
