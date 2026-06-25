import { TableCell } from '@tet/ui';
import { PropsWithChildren } from 'react';

export const AuditInputCell = ({
  cellId,
  children,
}: PropsWithChildren<{ cellId: string }>) => (
  <TableCell
    className="!text-center"
    tabIndex={-1}
    data-cell-id={cellId}
    onClick={(event) => event.stopPropagation()}
  >
    {children}
  </TableCell>
);
