import { cn, TableHeaderCell } from '@tet/ui';
import { JSX } from 'react';
import { useGridContext } from './grid-context';
import { STICKY_LEFT_SHADOW_CLASSNAME } from './scroll-shadow';

type Props = {
  title: string;
};

export const IndicateurTitleCell = ({ title }: Props): JSX.Element => {
  const { isGrouped } = useGridContext();

  return (
    <TableHeaderCell
      role="rowheader"
      pinnedLeft
      className={cn(
        'border-b border-grey-3',
        STICKY_LEFT_SHADOW_CLASSNAME,
        isGrouped && 'pl-8'
      )}
    >
      {title}
    </TableHeaderCell>
  );
};
