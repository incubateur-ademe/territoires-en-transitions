import { TableCell } from './table.cell';
import { TableRow } from './table.row';

/**
 * Use it to display loading rows in a table.
 * Automatically fill cells based on the number of columns.
 */
export const TableLoading = ({
  columnIds,
  nbOfRows = 10,
}: {
  columnIds: string[];
  nbOfRows?: number;
}) =>
  [...Array(nbOfRows).keys()].map((i) => (
    <TableRow key={i}>
      {columnIds.map((columnId) => (
        <TableCell key={columnId}>
          <div className="animate-pulse h-5 bg-grey-2 rounded-md" />
        </TableCell>
      ))}
    </TableRow>
  ));
