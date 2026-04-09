import { Cell } from '@tanstack/react-table';
import { cn, TableCell } from '@tet/ui';
import { ActionListItem } from '../actions/use-list-actions';
import { ScoreProgressBar } from '../scores/score.progress-bar';
import { useReferentielTableCellFocus } from './referentiel-table.keyboard';

type Props = {
  row: ActionListItem;
  cell: Cell<ActionListItem, unknown>;
  toggleRowExpanded?: () => void;
  canToggle?: boolean;
};

export const ReferentielTableProgressionCell = ({
  row,
  cell,
  toggleRowExpanded,
}: Props) => {
  const { referentielCellProps } = useReferentielTableCellFocus(cell);
  const haveChildren = row.childrenIds.length > 0;
  const canToggleExpand = Boolean(toggleRowExpanded) && haveChildren;

  return (
    <TableCell
      {...referentielCellProps}
      className={cn(
        canToggleExpand ? 'cursor-pointer' : '',
        referentielCellProps.className
      )}
      onClick={canToggleExpand ? toggleRowExpanded : undefined}
    >
      <ScoreProgressBar action={row} />
    </TableCell>
  );
};
