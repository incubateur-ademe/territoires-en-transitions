import { cn } from '../../utils/cn';

import { InlineEditWrapper, InlineEditWrapperProps } from '../inline-edit';

export type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement>;

type Props = TableCellProps & {
  edit?: Omit<InlineEditWrapperProps, 'children'>;
  canEdit?: boolean;
};

export const TableCell = ({
  className,
  children,
  edit,
  canEdit,
  ...props
}: Props) => {
  if (edit && canEdit) {
    return (
      <InlineEditWrapper {...edit}>
        <Cell {...props} className={cn('-outline-offset-2', className)}>
          {children}
        </Cell>
      </InlineEditWrapper>
    );
  }

  return (
    <Cell className={className} {...props}>
      {children}
    </Cell>
  );
};

const Cell = ({ className, children, ...props }: TableCellProps) => (
  <td
    {...props}
    className={cn('px-4 py-3 text-left !bg-transparent', className)}
  >
    {children}
  </td>
);
