import { Children, isValidElement, ReactNode } from 'react';
import { cn } from '../../utils/cn';

import { InlineEditWrapper, InlineEditWrapperProps } from '../inline-edit';

type TableCellHtmlProps = React.TdHTMLAttributes<HTMLTableCellElement>;

export type TableCellProps = TableCellHtmlProps & {
  edit?: Omit<InlineEditWrapperProps, 'children'>;
  canEdit?: boolean;
  placeholder?: string;
};

function hasVisibleChildren(children: ReactNode): boolean {
  let found = false;
  Children.forEach(children, (child) => {
    if (found) return;
    if (child == null || child === false || child === '') return;
    if (typeof child === 'string' && child.trim() === '') return;
    if (isValidElement(child)) {
      found = true;
      return;
    }
    found = true;
  });
  return found;
}

export const TableCell = ({
  className,
  children,
  edit,
  canEdit,
  placeholder,
  ...props
}: TableCellProps) => {
  const showPlaceholder = canEdit && !hasVisibleChildren(children);
  const renderedChildren = showPlaceholder ? (
    <span className="text-grey-5 text-xs italic pointer-events-none select-none">
      {placeholder ?? 'Cliquer pour éditer'}
    </span>
  ) : (
    children
  );

  if (edit && canEdit) {
    return (
      <InlineEditWrapper {...edit}>
        <Cell
          {...props}
          data-inline-edit={canEdit ? 'true' : undefined}
          className={cn('-outline-offset-2', className)}
        >
          {renderedChildren}
        </Cell>
      </InlineEditWrapper>
    );
  }

  return (
    <Cell className={className} {...props}>
      {renderedChildren}
    </Cell>
  );
};

const Cell = ({ className, children, ...props }: TableCellProps) => (
  <td {...props} className={cn('px-4 py-3 text-left ', className)}>
    {children}
  </td>
);
