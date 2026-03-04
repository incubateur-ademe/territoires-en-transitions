import { CellContext } from '@tanstack/react-table';
import { TableCell, Tooltip } from '@tet/ui';
import { ActionListItem } from '../actions/use-list-actions';

type Props = {
  info: CellContext<ActionListItem, string>;
};

export const ReferentielTableDescriptionCell = ({ info }: Props) => {
  const value = info.getValue();
  const cellId = info.cell.id;

  if (!value) {
    return <TableCell tabIndex={-1} data-cell-id={cellId} />;
  }

  return (
    <TableCell tabIndex={-1} data-cell-id={cellId}>
      <Tooltip label={value}>
        <span className="line-clamp-2 text-grey-8">{value}</span>
      </Tooltip>
    </TableCell>
  );
};
