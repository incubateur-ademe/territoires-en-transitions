import { cn, TableCell } from '@tet/ui';
import { ScoreRatioBadge } from '../scores/score.ratio-badge';
import { ReferentielTableRow } from './types';
import { actionTypeToClassName } from './utils';

type Props = {
  row: ReferentielTableRow;
};

export const ReferentielTableScoreRatioCell = ({ row }: Props) => {
  return (
    <TableCell className={cn(actionTypeToClassName[row.type])}>
      <ScoreRatioBadge actionId={row.id} size="xs" />
    </TableCell>
  );
};
