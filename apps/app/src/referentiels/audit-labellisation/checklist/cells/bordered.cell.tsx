import { cn, TableCell } from '@tet/ui';
import { ReactElement, ReactNode } from 'react';

export const BorderedCell = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): ReactElement => (
  <TableCell
    className={cn('border-r border-grey-4 last:border-r-0', className)}
  >
    {children}
  </TableCell>
);
