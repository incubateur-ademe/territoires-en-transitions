import Link from 'next/link';
import { JSX, ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { Icon, IconValue } from '../Icon';

type LinkListProps = {
  children: ReactNode;
  /** Encadre la liste (bordure arrondie) ; sinon, seuls des traits séparent les lignes. */
  framed?: boolean;
  /** `sm` pour les listes denses, dans un panneau latéral par exemple. */
  size?: 'sm' | 'md';
  dataTest?: string;
  className?: string;
};

type LinkListItemProps = {
  title: ReactNode;
  description?: ReactNode;
  icon?: IconValue;
  dataTest?: string;
} & ({ href: string; onClick?: never } | { onClick: () => void; href?: never });

/**
 * Liste de lignes cliquables menant chacune vers une page ou une action,
 * terminées par un chevron.
 */
export const LinkList = ({
  children,
  framed = true,
  size = 'md',
  dataTest,
  className,
}: LinkListProps): JSX.Element => (
  <ul
    data-test={dataTest}
    data-size={size}
    data-framed={framed}
    className={cn(
      'group/link-list mb-0 pl-0 list-none',
      framed
        ? 'border border-grey-3 rounded-lg bg-white overflow-hidden'
        : 'border-y border-grey-3',
      className
    )}
  >
    {children}
  </ul>
);

export const LinkListItem = ({
  title,
  description,
  icon,
  dataTest,
  ...action
}: LinkListItemProps): JSX.Element => {
  const className = cn(
    'w-full flex items-center gap-4 text-left bg-none after:hidden hover:bg-primary-1 transition',
    'py-4 px-4 md:px-6 group-data-[size=sm]/link-list:py-3 group-data-[size=sm]/link-list:gap-3',
    // Sans cadre, les lignes s'alignent sur le contenu qui les entoure.
    'group-data-[framed=false]/link-list:px-0'
  );

  const content = (
    <>
      {!!icon && (
        <Icon
          icon={icon}
          size="md"
          aria-hidden
          className="text-primary-9 shrink-0"
        />
      )}
      <span className="flex-1 min-w-0 flex flex-wrap items-center gap-x-6 gap-y-1">
        <span className="basis-[280px] shrink text-base leading-6 font-bold text-primary-9 group-data-[size=sm]/link-list:text-sm group-data-[size=sm]/link-list:font-normal group-data-[size=sm]/link-list:text-primary-10">
          {title}
        </span>
        {!!description && (
          <span className="flex-[1_1_320px] text-sm leading-[22px] text-grey-8">
            {description}
          </span>
        )}
      </span>
      <Icon
        icon="arrow-right-s-line"
        size="md"
        aria-hidden
        className="text-primary-8 shrink-0 group-data-[size=sm]/link-list:text-grey-6"
      />
    </>
  );

  return (
    <li className="border-t border-grey-3 first:border-t-0">
      {action.href !== undefined ? (
        <Link href={action.href} data-test={dataTest} className={className}>
          {content}
        </Link>
      ) : (
        <button
          type="button"
          onClick={action.onClick}
          data-test={dataTest}
          className={className}
        >
          {content}
        </button>
      )}
    </li>
  );
};
