import { TableCell } from '@tet/ui';
import { ActionListItem } from '../actions/use-list-actions';
import { ScoreRatioBadge } from '../scores/score.ratio-badge';

type Props = {
  row: ActionListItem;
};

export const ReferentielTableScoreRatioCell = ({ row }: Props) => {
  return (
    <TableCell>
      <ScoreRatioBadge action={row} size="xs" />
    </TableCell>
  );
};
