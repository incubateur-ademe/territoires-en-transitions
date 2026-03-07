import { cn, TableCell } from '@tet/ui';
import { ScoreProgressBar } from '../scores/score.progress-bar';
import { ReferentielTableRow } from './types';
import { actionTypeToClassName } from './utils';

type Props = {
  row: ReferentielTableRow;
  toggleRowExpanded?: () => void;
  canToggle?: boolean;
};

export const ReferentielTableProgressionCell = ({
  row,
  toggleRowExpanded,
}: Props) => {
  return (
    <TableCell
      className={cn(
        actionTypeToClassName[row.type],
        toggleRowExpanded ? 'cursor-pointer' : ''
      )}
      onClick={toggleRowExpanded}
    >
      <ScoreProgressBar
        id={row.id}
        identifiant={row.identifiant}
        type={row.type}
      />
    </TableCell>
  );
};
