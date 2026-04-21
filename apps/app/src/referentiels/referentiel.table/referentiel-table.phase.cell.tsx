import { CellContext } from '@tanstack/react-table';
import { TableCell } from '@tet/ui';
import { ActionListItem } from '../actions/use-list-actions';
import { phaseToLabel } from '../utils';

type Props = {
  info: CellContext<ActionListItem, ActionListItem['categorie']>;
};

export const ReferentielTablePhaseCell = ({ info }: Props) => {
  const value = info.getValue();
  const cellId = info.cell.id;

  return (
    <TableCell tabIndex={-1} data-cell-id={cellId} className="text-center">
      {value && (
        <span className="capitalize text-grey-8">{phaseToLabel[value]}</span>
      )}
    </TableCell>
  );
};
