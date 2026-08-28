import { cn, TableHeaderCell } from '@tet/ui';
import { JSX } from 'react';
import { STICKY_LEFT_SHADOW_CLASSNAME } from './scroll-shadow';

type Props = {
  title: string;
};

export const IndicateurTitleCell = ({ title }: Props): JSX.Element => (
  <TableHeaderCell
    role="rowheader"
    pinnedLeft
    className={cn(
      'border-b border-grey-3 align-middle',
      STICKY_LEFT_SHADOW_CLASSNAME
    )}
  >
    {title}
  </TableHeaderCell>
);
