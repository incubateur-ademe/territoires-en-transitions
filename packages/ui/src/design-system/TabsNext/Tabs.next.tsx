'use client';

import classNames from 'classnames';
import { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, ReactNode, useContext } from 'react';
import { cn } from '../../utils/cn';
import { Icon, IconValue } from '../Icon';
import { Tooltip } from '../Tooltip';
import { TabSize } from '../Tabs/Tabs';

type TabsContextProps = {
  /** Permet d'ajuster les styles de la liste d'onglets */
  tabsListClassName?: string;
  /** Taille des boutons */
  size?: TabSize;
};

type TabsProps = TabsContextProps & {
  dataTest?: string;
  /** Permet d'ajuster les styles du container */
  className?: string;
  /** Onglets */
  children: ReactNode[];
};

/**
 *  Affiche un groupe d'onglets.
 */
export function Tabs({
  dataTest,
  className,
  children,
  // tabsListClassName,
  // tabPanelClassName,
  // defaultActiveTab = 0,
  // size = 'md',
  // onChange,
  ...props
}: TabsProps) {
  return (
    <TabsProvider {...props}>
      <div className={classNames(className)} data-test={dataTest}>
        {children}
      </div>
    </TabsProvider>
  );
}

const TabsContext = createContext<TabsContextProps>({});

function TabsProvider({ children, ...props }: { children: ReactNode }) {
  return <TabsContext.Provider value={props}>{children}</TabsContext.Provider>;
}

function useTabsContext() {
  const context = useContext(TabsContext);
  if (context === undefined) {
    throw new Error('useTabsContext must be used within a TabsProvider');
  }
  return context;
}

export const TabsList = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => {
  return (
    <ul
      className={cn(
        'inline-flex flex-wrap gap-y-6 justify-center rounded-lg bg-grey-2 p-2 gap-3 md:gap-6 w-full !list-none',
        className
      )}
      role="tablist"
    >
      {children}
    </ul>
  );
};

export type TabProps = {
  label: string;
  href: Route;
  isActive?: boolean;
  icon?: IconValue;
  iconClassName?: string;
  iconPosition?: 'left' | 'right';
  title?: string;
  tooltip?: string;
};

export const TabsTab = (props: TabProps) => {
  const { size } = useTabsContext();
  const pathname = usePathname();
  const isTabActive = props.isActive || pathname.endsWith(props.href);

  const link = (
    <Link
      className={cn(
        // styles communs
        'flex items-center px-3 py-1 font-bold w-max bg-none',
        // variante au survol
        'hover:rounded-md hover:shadow-button hover:!bg-primary-2 hover:text-primary-9',
        {
          // variante de taille
          'text-md': size === 'md',
          'text-sm': size === 'sm',
          'text-xs': size === 'xs',
          // variante pour l'onglet actif
          'border border-grey-3 rounded-md shadow-button bg-white text-primary-9':
            isTabActive,
          // variante pour les onglets inactifs
          'text-primary-10': !isTabActive,
        }
      )}
      type="button"
      role="tab"
      id={`tab-${props.href}`}
      aria-selected={isTabActive ? 'true' : 'false'}
      title={props.title}
      href={props.href}
    >
      {props.icon && (!props.iconPosition || props.iconPosition === 'left') && (
        <Icon
          icon={props.icon}
          size={size}
          className={cn('mr-1', props.iconClassName)}
        />
      )}
      {props.label}
      {props.icon && props.iconPosition === 'right' ? (
        <Icon
          icon={props.icon}
          size={size}
          className={cn('ml-1', props.iconClassName)}
        />
      ) : (
        props.tooltip && (
          <Icon icon="information-line" size={size} className="ml-1" />
        )
      )}
    </Link>
  );
  return (
    <li role="presentation" className="p-0">
      {props.tooltip ? <Tooltip label={props.tooltip}>{link}</Tooltip> : link}
    </li>
  );
};

export const TabsPanel = ({ children }: { children: ReactNode }) => {
  return (
    <div className="grow flex flex-col p-7 border border-grey-3 bg-white rounded-lg">
      {children}
    </div>
  );
};

Tabs.Tab = TabsTab;
Tabs.List = TabsList;
Tabs.Panel = TabsPanel;
