import { cn } from '../../utils/cn';

import { InlineEditWrapper, InlineEditWrapperProps } from '../inline-edit';

type TableCellHtmlProps = React.TdHTMLAttributes<HTMLTableCellElement>;

export type TableCellProps = TableCellHtmlProps & {
  edit?: Omit<InlineEditWrapperProps, 'children'>;
  canEdit?: boolean;
};

export const TableCell = ({
  className,
  children,
  edit,
  canEdit,
  ...props
}: TableCellProps) => {
  if (edit && canEdit) {
    return (
      <InlineEditWrapper {...edit}>
        <Cell
          {...props}
          data-inline-edit={canEdit ? 'true' : undefined}
          className={cn('-outline-offset-2', className)}
        >
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
  <td {...props} className={cn('px-4 py-3 text-left ', className)}>
    {children}
  </td>
);
