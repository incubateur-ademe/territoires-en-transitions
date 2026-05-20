import { cn, TableHeaderCell } from '@tet/ui';
import { ReactElement } from 'react';

export const BorderedHeaderCell = ({
  title,
  className,
}: {
  title?: string;
  className?: string;
}): ReactElement => (
  <TableHeaderCell
    title={title}
    className={cn(
      'bg-grey-1 border-r border-grey-4 last:border-r-0',
      className
    )}
  />
);
