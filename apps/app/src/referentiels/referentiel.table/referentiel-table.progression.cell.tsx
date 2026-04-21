import { Cell } from '@tanstack/react-table';
import { StatutAvancementEnum } from '@tet/domain/referentiels';
import { TableCell } from '@tet/ui';
import { ActionListItem } from '../actions/use-list-actions';
import { ScoreProgressBar } from '../scores/score.progress-bar';

type Props = {
  row: ActionListItem;
  cell: Cell<ActionListItem, unknown>;
};

export const ReferentielTableProgressionCell = ({ row, cell }: Props) => {
  const { score } = row;
  const hideProgression =
    score.statut === StatutAvancementEnum.NON_CONCERNE ||
    score.statut === StatutAvancementEnum.NON_RENSEIGNABLE ||
    score.pointPotentiel === 0;

  return (
    <TableCell tabIndex={-1} data-cell-id={cell.id}>
      {hideProgression ? null : (
        <ScoreProgressBar action={row} className="opacity-80 min-w-[10rem]" />
      )}
    </TableCell>
  );
};
