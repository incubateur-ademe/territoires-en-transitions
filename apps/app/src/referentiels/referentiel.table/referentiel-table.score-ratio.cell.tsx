import { Cell } from '@tanstack/react-table';
import { ActionType, ActionTypeEnum } from '@tet/domain/referentiels';
import { roundTo } from '@tet/domain/utils';
import { Badge, TableCell } from '@tet/ui';
import { ActionListItem } from '../actions/use-list-actions';
import { ScoreRatioBadge } from '../scores/score.ratio-badge';
import { useReferentielTableCellFocus } from './referentiel-table.keyboard';

type Props = {
  row: ActionListItem;
  cell: Cell<ActionListItem, unknown>;
};

const actionTypesWithScoreRatio = new Set<ActionType>([
  ActionTypeEnum.AXE,
  ActionTypeEnum.SOUS_AXE,
  ActionTypeEnum.ACTION,
]);

export const ReferentielTableScoreRatioCell = ({ row, cell }: Props) => {
  const { referentielCellProps } = useReferentielTableCellFocus(cell);

  const { pointFait, pointPotentiel } = row.score;

  const pointFaitRounded = roundTo(pointFait, 1);
  const pointPotentielRounded = roundTo(pointPotentiel, 1);
  const ratioFait = roundTo((pointFait / pointPotentiel) * 100, 1);

  if (!actionTypesWithScoreRatio.has(row.actionType)) {
    return (
      <TableCell {...referentielCellProps}>
        <Badge
          title={`${pointFaitRounded} / ${pointPotentielRounded} points`}
          variant={ratioFait >= 100 ? 'success' : 'grey'}
          type={ratioFait >= 100 ? 'solid' : 'outlined'}
          uppercase={false}
          size={'xs'}
          className="m-auto"
        />
      </TableCell>
    );
  }

  return (
    <TableCell {...referentielCellProps}>
      <ScoreRatioBadge action={row} size="xs" className="m-auto" />
    </TableCell>
  );
};
