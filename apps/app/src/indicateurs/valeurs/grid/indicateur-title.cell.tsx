import { cn, TableHeaderCell } from '@tet/ui';
import { JSX } from 'react';
import { useGridContext } from './grid-context';

type Props = {
  title: string;
};

export const IndicateurTitleCell = ({ title }: Props): JSX.Element => {
  const { isGrouped } = useGridContext();

  return (
    <TableHeaderCell
      role="rowheader"
      pinnedLeft
      className={cn('border-b border-grey-3', isGrouped && 'pl-8')}
    >
      {title}
    </TableHeaderCell>
  );
};
