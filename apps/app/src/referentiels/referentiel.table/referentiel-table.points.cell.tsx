import { toLocaleFixed } from '@/app/utils/to-locale-fixed';
import { ActionType } from '@tet/domain/referentiels';
import { cn, TableCell } from '@tet/ui';
import { isNil } from 'es-toolkit';
import { actionTypeToClassName } from './utils';

type Props = {
  value?: number | null;
  percentage?: boolean;
  actionType: ActionType;
};

export const ReferentielTablePointsCell = ({
  value,
  percentage,
  actionType,
}: Props) => {
  const nonNullableValue = isNil(value) ? 0 : value;

  const displayValue = percentage
    ? toLocaleFixed(nonNullableValue * 100, 2)
    : nonNullableValue;

  return (
    <TableCell className={cn(actionTypeToClassName[actionType])}>
      <div className="w-full text-center">
        <>{percentage ? `${displayValue}%` : displayValue}</>
      </div>
    </TableCell>
  );
};
