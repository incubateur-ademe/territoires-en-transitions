import { Cell } from '@tanstack/react-table';
import { TableCell } from '@tet/ui';
import { ActionListItem } from '../actions/use-list-actions';
import { ProgressionBadgeAndBar } from './progression-badge-and-bar';

type Props = {
  row: ActionListItem;
  cell: Cell<ActionListItem, unknown>;
};

export const ReferentielTableProgressionCell = ({ row, cell }: Props) => {
  return (
    <TableCell tabIndex={-1} data-cell-id={cell.id}>
      <ProgressionBadgeAndBar action={row} />
    </TableCell>
  );
};
