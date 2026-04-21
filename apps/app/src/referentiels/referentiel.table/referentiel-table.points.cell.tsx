import { toLocaleFixed } from '@/app/utils/to-locale-fixed';
import { TableCell } from '@tet/ui';
import { isNil } from 'es-toolkit';

type Props = {
  value?: number | null;
  percentage?: boolean;
  cellId?: string;
};

export const ReferentielTablePointsCell = ({
  value,
  percentage,
  cellId,
}: Props) => {
  if (isNil(value)) {
    return (
      <TableCell
        tabIndex={-1}
        data-cell-id={cellId}
        className="text-center text-grey-6"
      >
        –
      </TableCell>
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
