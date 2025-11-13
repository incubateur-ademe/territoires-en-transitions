import { cn } from '../../utils/cn';

type Props = React.HTMLAttributes<HTMLTableElement>;

/**
 * `table-fixed` is set by default to ensure consistent column widths with pagination.
 *  Set column widths via `HeaderCell` components in columns definition.
 */
export const Table = ({ className, ...props }: Props) => {
  return <table className={cn('table-fixed w-full', className)} {...props} />;
};
