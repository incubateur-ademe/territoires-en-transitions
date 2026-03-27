import { CellContext } from '@tanstack/react-table';
import { ActionType, ActionTypeEnum } from '@tet/domain/referentiels';
import { TableCell, TableCellRichTextEditor } from '@tet/ui';
import { ActionListItem } from '../actions/use-list-actions';
import { useUpdateActionExplication } from '../actions/use-update-action-explication';
import { useReferentielTableCellFocus } from './referentiel-table.keyboard';
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
  const { referentielCellProps } = useReferentielTableCellFocus(info.cell);
  const action = info.row.original;

  if (!actionTypesWithExplication.has(action.actionType)) {
    return <TableCell {...referentielCellProps} />;
  }

  const {
    actionId,
    score: { explication },
  } = action;

  const { collectiviteId } = getTableMeta(info.table);

  return (
    <TableCellRichTextEditor
      {...referentielCellProps}
      canEdit={canEdit}
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
