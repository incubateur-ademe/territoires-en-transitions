import { TableCell } from '@tet/ui';

export const EmptyCell = ({ cellId }: { cellId: string }) => (
  <TableCell tabIndex={-1} data-cell-id={cellId} />
);
