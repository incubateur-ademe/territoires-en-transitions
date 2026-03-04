import { toLocaleFixed } from '@/app/utils/to-locale-fixed';
import {
  StatutAvancement,
  StatutAvancementEnum,
} from '@tet/domain/referentiels';
import { TableCell } from '@tet/ui';
import { isNil } from 'es-toolkit';

type Props = {
  value?: number | null;
  statut?: StatutAvancement | null;
  percentage?: boolean;
  cellId?: string;
};

export const ReferentielTablePointsCell = ({
  value,
  statut,
  percentage,
  cellId,
}: Props) => {
  if (
    isNil(value) ||
    statut === StatutAvancementEnum.NON_CONCERNE ||
    statut === StatutAvancementEnum.NON_RENSEIGNABLE
  ) {
    return (
      <TableCell
        tabIndex={-1}
        data-cell-id={cellId}
        className="text-center text-grey-6"
      ></TableCell>
    );
  }

  const displayValue = percentage
    ? toLocaleFixed(value * 100, 1)
    : toLocaleFixed(value, 1);

  return (
    <TableCell tabIndex={-1} data-cell-id={cellId}>
      <div className="w-full text-center tabular-nums">
        {percentage ? `${displayValue}%` : displayValue}
      </div>
    </TableCell>
  );
};
