import {
  EmptyCard,
  EmptyCardProps,
} from '../../components/EmptyCard/EmptyCard';
import { cn } from '../../utils/cn';
import { TableRow } from './table.row';

type Props = EmptyCardProps & {
  columnIds: string[];
};

/**
 * Use it as the empty state of a table.
 * A single row with 1 cell that cover all columns
 * and contains an empty card.
 */
export const TableEmpty = ({
  columnIds,
  className,
  variant = 'transparent',
  size = 'xs',
  ...props
}: Props) => (
  <TableRow>
    <td colSpan={columnIds.length}>
      <EmptyCard
        {...props}
        className={cn('min-h-[50vh]', className)}
        variant={variant}
        size={size}
      />
    </td>
  </TableRow>
);
