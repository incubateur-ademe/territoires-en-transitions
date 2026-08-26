import { ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { Icon } from '../Icon';

type Props = Omit<React.ThHTMLAttributes<HTMLTableCellElement>, 'title'> & {
  sortFn?: () => void;
  icon?: string;
  /** Accepte un noeud pour accoler au libellé une infobulle ou un indicateur. */
  title?: ReactNode;
  titleClassName?: string;
  /** Pins the cell on horizontal scroll (typically the first column). */
  pinnedLeft?: boolean;
  /**
   * Alignement du contenu de l'en-tête. Un `th` est centré par défaut en HTML,
   * ce qui ne convient presque jamais à un tableau : le design-system aligne à
   * gauche, et les colonnes qui veulent autre chose le disent ici.
   */
  align?: 'left' | 'center' | 'right';
  /** Composant de filtre (Select, Input, etc.) affiché sous le titre. */
  filter?: ReactNode;
  /** ClassName du conteneur du filtre (row du dessous) */
  filterClassName?: string;
};

const alignClassNames: Record<NonNullable<Props['align']>, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export const pinnedLeftClassName =
  'sticky left-0 z-10 bg-inherit shadow-[1px_0_0_0] shadow-grey-3';

/** Header cell for tables with predefined optional sorting, icon and filter */
export const TableHeaderCell = ({
  sortFn,
  icon,
  className,
  title,
  titleClassName,
  filter,
  filterClassName,
  pinnedLeft,
  align = 'left',
  children,
  ...props
}: Props) => {
  return (
    <th
      {...props}
      className={cn(
        'px-4 py-3 text-sm text-grey-9 font-medium leading-none align-top',
        { [pinnedLeftClassName]: pinnedLeft },
        className,
        pinnedLeft && 'bg-white'
      )}
    >
      <div className={cn('flex flex-col', filter && 'gap-2')}>
        <div className={cn('flex items-center gap-2', alignClassNames[align])}>
          {icon && (
            <Icon
              icon={icon}
              size={children ? 'sm' : 'md'}
              className={cn({ 'm-auto': !children && !title })}
            />
          )}
          {title !== null && title !== undefined && (
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
