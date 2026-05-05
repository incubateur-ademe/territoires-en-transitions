import { ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { Icon } from '../Icon';

type Props = React.HTMLAttributes<HTMLTableCellElement> & {
  sortFn?: () => void;
  icon?: string;
  title?: string;
  titleClassName?: string;
  /** Composant de filtre (Select, Input, etc.) affiché sous le titre. */
  filter?: ReactNode;
  /** ClassName du conteneur du filtre (row du dessous) */
  filterClassName?: string;
};

/** Header cell for tables with predefined optional sorting, icon and filter */
export const TableHeaderCell = ({
  sortFn,
  icon,
  className,
  title,
  titleClassName,
  filter,
  filterClassName,
  children,
  ...props
}: Props) => {
  return (
    <th
      {...props}
      className={cn(
        'px-4 py-3 text-sm text-grey-9 font-medium leading-none align-top',
        className
      )}
    >
      <div className={cn('flex flex-col', filter && 'gap-2')}>
        <div className="flex items-center gap-2">
          {icon && (
            <Icon
              icon={icon}
              size={children ? 'sm' : 'md'}
              className={cn({ 'm-auto': !children && !title })}
            />
          )}
          {title && (
            <span className={cn('uppercase', titleClassName)}>{title}</span>
          )}
          {children}
          {sortFn && (
            <div
              className="flex flex-col ml-auto cursor-pointer"
              onClick={sortFn}
            >
              <Icon
                icon="arrow-up-s-fill"
                className="-mb-0.5 flex items-center justify-center !h-3 !w-3 text-[0.75rem]"
              />
              <Icon
                icon="arrow-down-s-fill"
                className="-mt-0.5 flex items-center justify-center !h-3 !w-3 text-[0.75rem]"
              />
            </div>
          )}
        </div>
        {filter && (
          <div className={cn('normal-case font-normal', filterClassName)}>
            {filter}
          </div>
        )}
      </div>
    </th>
  );
};
