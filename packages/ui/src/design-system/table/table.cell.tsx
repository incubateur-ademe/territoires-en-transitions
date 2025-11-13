import { cn } from '../../utils/cn';

type Props = React.HTMLAttributes<HTMLTableCellElement>;

export const TableCell = ({ className, ...props }: Props) => {
  return (
    <td
      {...props}
      className={cn('px-4 py-3 text-left !bg-transparent', className)}
    />
  );
};
