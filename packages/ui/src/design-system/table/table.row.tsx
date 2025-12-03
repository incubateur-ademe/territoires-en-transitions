import { cn } from '../../utils/cn';

type Props = React.HTMLAttributes<HTMLTableRowElement>;

export const TableRow = ({ className, ...props }: Props) => (
  <tr
    className={cn(
      'group relative border-b border-grey-3 even:bg-grey-1',
      className
    )}
    {...props}
  />
);
