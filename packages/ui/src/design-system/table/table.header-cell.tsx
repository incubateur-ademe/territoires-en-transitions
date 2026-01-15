import { cn } from '../../utils/cn';
import { Icon } from '../Icon';

type Props = React.HTMLAttributes<HTMLTableCellElement> & {
  sortFn?: () => void;
  icon?: string;
  title?: string;
};

/** Header cell for tables with predefined optional sorting and icon */
export const TableHeaderCell = ({
  sortFn,
  icon,
  className,
  title,
  children,
  ...props
}: Props) => {
  return (
    <th
      {...props}
      className={cn(
        'px-4 py-3 text-sm text-grey-9 font-medium leading-none',
        className
      )}
    >
      <div className="flex items-center gap-2">
        {icon && (
          <Icon
            icon={icon}
            size={children ? 'sm' : 'md'}
            className={cn({ 'm-auto': !children && !title })}
          />
        )}
        {title && <span className="uppercase">{title}</span>}
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
    </th>
  );
};
