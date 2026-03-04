import { Children, isValidElement, ReactNode } from 'react';
import { cn } from '../../utils/cn';

import { InlineEditWrapper, InlineEditWrapperProps } from '../inline-edit';
import { pinnedLeftClassName } from './table.header-cell';

type TableCellHtmlProps = React.TdHTMLAttributes<HTMLTableCellElement>;

export type TableCellProps = TableCellHtmlProps & {
  edit?: Omit<InlineEditWrapperProps, 'children'>;
  canEdit?: boolean;
  placeholder?: string;
  /** Pins the cell on horizontal scroll (typically the first column). */
  pinnedLeft?: boolean;
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
  pinnedLeft,
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
          pinnedLeft={pinnedLeft}
          data-inline-edit={canEdit ? 'true' : undefined}
          className={cn('-outline-offset-2', className, {
            'hover:bg-primary-0 focus:bg-primary-0': canEdit,
          })}
        >
          {renderedChildren}
        </Cell>
      </InlineEditWrapper>
    );
  }

  return (
    <Cell className={className} pinnedLeft={pinnedLeft} {...props}>
      {renderedChildren}
    </Cell>
  );
};

const Cell = ({
  className,
  children,
  pinnedLeft,
  ...props
}: TableCellProps) => {
  return (
    <td
      {...props}
      className={cn(
        'px-4 py-3 text-left',
        { [pinnedLeftClassName]: pinnedLeft },
        className
      )}
    >
      {children}
    </td>
  );
};
