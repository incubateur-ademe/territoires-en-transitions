import { toLocaleFixed } from '@/app/utils/to-locale-fixed';
import { TableCell } from '@tet/ui';
import { isNil } from 'es-toolkit';

type Props = {
  value?: number | null;
  percentage?: boolean;
};

export const ReferentielTablePointsCell = ({ value, percentage }: Props) => {
  const nonNullableValue = isNil(value) ? 0 : value;

  const displayValue = percentage
    ? toLocaleFixed(nonNullableValue * 100, 2)
    : nonNullableValue;

  return (
    <TableCell>
      <div className="w-full text-center">
        <>{percentage ? `${displayValue}%` : displayValue}</>
      </div>
    </TableCell>
  );
};
