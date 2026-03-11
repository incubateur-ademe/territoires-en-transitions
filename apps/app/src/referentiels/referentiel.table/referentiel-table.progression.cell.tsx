import { cn, TableCell } from '@tet/ui';
import { ScoreProgressBar } from '../scores/score.progress-bar';
import { ReferentielTableRow } from './types';
import { actionTypeToClassName } from './utils';

type Props = {
  row: ReferentielTableRow;
};

export const ReferentielTableProgressionCell = ({ row }: Props) => {
  return (
    <TableCell className={cn(actionTypeToClassName[row.type])}>
      <ScoreProgressBar
        id={row.id}
        identifiant={row.identifiant}
        type={row.type}
      />
    </TableCell>
  );
};
