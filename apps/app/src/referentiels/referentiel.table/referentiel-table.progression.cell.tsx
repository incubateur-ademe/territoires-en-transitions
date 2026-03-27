import { cn, TableCell } from '@tet/ui';
import { ActionListItem } from '../actions/use-list-actions';
import { ScoreProgressBar } from '../scores/score.progress-bar';

type Props = {
  row: ActionListItem;
  toggleRowExpanded?: () => void;
  canToggle?: boolean;
};

export const ReferentielTableProgressionCell = ({
  row,
  toggleRowExpanded,
}: Props) => {
  return (
    <TableCell
      className={cn(toggleRowExpanded ? 'cursor-pointer' : '')}
      onClick={toggleRowExpanded}
    >
      <ScoreProgressBar action={row} />
    </TableCell>
  );
};
