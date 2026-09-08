'use client';

import classNames from 'classnames';
import { Route } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  createContext,
  KeyboardEvent,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
} from 'react';
import { cn } from '../../utils/cn';
import { Badge, BadgeProps } from '../Badge';
import { Icon, IconSize, IconValue } from '../Icon';
import { TabSize } from '../Tabs/Tabs';
import { Tooltip } from '../Tooltip';

/** Apparence des onglets : pastilles (par défaut) ou cartes */
export type TabVariant = 'pill' | 'card';

type TabsContextProps = {
  /** Taille des boutons */
  size?: TabSize;
  /** Apparence des onglets */
  variant?: TabVariant;
  /** Préfixe d'id unique pour ce groupe d'onglets */
  baseId: string;
  /** Id de l'onglet actif (pour lier le panneau) */
  activeTabId: string | null;
  setActiveTabId: (id: string) => void;
  /**
   * Id du premier onglet monté : tant qu'aucun n'est actif, c'est lui qui
   * reste focusable au clavier (roving tabindex — un tablist doit toujours
   * avoir exactement un onglet avec tabIndex 0).
   */
  firstTabId: string | null;
  registerTab: (id: string) => void;
};

type TabsProps = {
  dataTest?: string;
  /** Permet d'ajuster les styles du container */
  className?: string;
  /** Taille des boutons */
  size?: TabSize;
  /** Apparence des onglets */
  variant?: TabVariant;
  /** Onglets */
  children: ReactNode[];
};

const TabsContext = createContext<TabsContextProps | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (context === null) {
    throw new Error('useTabsContext must be used within a TabsProvider');
  }
  return context;
}

function getPanelId(tabId: string) {
  return `${tabId}-panel`;
}

function getTabsInList(tablist: HTMLElement): HTMLElement[] {
  return Array.from(tablist.querySelectorAll<HTMLElement>('[role="tab"]'));
}

function focusTab(tabs: HTMLElement[], index: number) {
  const tab = tabs[index];
  if (!tab) return;
  tab.focus();
}

/**
 *  Affiche un groupe d'onglets.
 */
export function Tabs({
  dataTest,
  className,
  children,
  size,
  variant,
}: TabsProps) {
  const baseId = useId();
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [firstTabId, setFirstTabId] = useState<string | null>(null);
  const registerTab = useCallback((id: string) => {
    setFirstTabId((current) => current ?? id);
  }, []);

  return (
    <TabsContext
      value={{
        size,
        variant,
        baseId,
        activeTabId,
        setActiveTabId,
        firstTabId,
        registerTab,
      }}
    >
      <div className={classNames(className)} data-test={dataTest}>
        {children}
      </div>
    </TabsContext>
  );
}

export const TabsList = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => {
  const { variant = 'pill' } = useTabsContext();

  const handleKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    const tabs = getTabsInList(event.currentTarget);
    if (tabs.length === 0) return;

    const currentIndex = tabs.findIndex(
      (tab) => tab === document.activeElement
    );
    if (currentIndex === -1) return;

    let nextIndex: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
        nextIndex = (currentIndex + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    focusTab(tabs, nextIndex);
  };

  return (
    <ul
      className={cn(
        'w-full !list-none m-0',
        {
          'inline-flex flex-wrap gap-y-6 justify-center rounded-lg bg-grey-2 p-2 gap-3 md:gap-6':
            variant === 'pill',
          'flex flex-wrap items-stretch justify-start gap-4 p-0':
            variant === 'card',
        },
        className
      )}
      role="tablist"
      onKeyDown={handleKeyDown}
    >
      {children}
    </ul>
  );
};

export type TabProps = {
  label: string;
  /** Onglet rendu comme un lien. Sans `href`, l'onglet est un bouton piloté par `onClick` */
  href?: Route;
  /** Appelée au clic sur l'onglet */
  onClick?: () => void;
  isActive?: boolean;
  icon?: IconValue;
  iconClassName?: string;
  /** Sans effet sur la variante `card`, où l'icône est toujours au-dessus du libellé */
  iconPosition?: 'left' | 'right';
  title?: string;
  tooltip?: string;
  badge?: Omit<BadgeProps, 'size'>;
  /** Id de l'onglet, déduit du `href` ou généré automatiquement */
  id?: string;
  /** Id pour les tests e2e */
  dataTest?: string;
};

/** Taille de l'icône de la carte associée à chaque taille d'onglet */
const cardIconSizeByTabSize: Record<TabSize, IconSize> = {
  xs: 'sm',
  sm: 'md',
  md: 'lg',
};

export const TabsTab = (props: TabProps) => {
  const {
    size = 'md',
    variant = 'pill',
    baseId,
    activeTabId,
    setActiveTabId,
    firstTabId,
    registerTab,
  } = useTabsContext();
  const generatedId = useId();
  const pathname = usePathname();
  const isTabActive =
    props.isActive ||
    (props.href !== undefined && pathname.endsWith(props.href));
  const isCard = variant === 'card';

  const tabId =
    props.id ??
    (props.href ? `${baseId}-tab-${props.href}` : `${baseId}-${generatedId}`);
  const panelId = getPanelId(tabId);

  useEffect(() => {
    if (isTabActive) {
      setActiveTabId(tabId);
    }
  }, [isTabActive, setActiveTabId, tabId]);

  useEffect(() => {
    registerTab(tabId);
  }, [registerTab, tabId]);

  const className = isCard
    ? cn(
        // styles communs
        'flex flex-col items-center justify-start text-center gap-2 w-full h-full p-4 bg-white bg-none after:hidden border border-solid rounded-lg transition',
        {
          // variante de taille
          'text-md': size === 'md' || size === undefined,
          'text-sm': size === 'sm',
          'text-xs': size === 'xs',
          // variante pour l'onglet actif
          'border-2 border-primary-7 text-primary-9 font-bold p-[calc(theme(spacing.4)-1px)]':
            isTabActive,
          // variante pour les onglets inactifs
          'border-grey-3 text-primary-10 hover:border-grey-4': !isTabActive,
        }
      )
    : cn(
        // styles communs
        'flex items-center gap-1.5 px-3 py-1 font-bold w-max bg-none',
        // variante au survol
        'hover:rounded-md hover:shadow-button hover:!bg-primary-2 hover:text-primary-9',
        {
          // variante de taille
          'text-md': size === 'md',
          'text-sm gap-1': size === 'sm',
          'text-xs gap-0.5': size === 'xs',
          // variante pour l'onglet actif
          'border border-grey-3 rounded-md shadow-button bg-white text-primary-9':
            isTabActive,
          // variante pour les onglets inactifs
          'text-primary-10': !isTabActive,
        }
      );

  const content = isCard ? (
    <>
      {props.icon && (
        <Icon
          icon={props.icon}
          size={cardIconSizeByTabSize[size]}
          className={cn(
            { 'text-primary-9': isTabActive, 'text-primary-10': !isTabActive },
            props.iconClassName
          )}
        />
      )}
      <span>{props.label}</span>
      {props.badge && (
        <Badge
          className={cn({
            'mt-0': size === 'xs',
            'mt-1': size === 'sm',
            'mt-2': size === 'md',
          })}
          size={size}
          {...props.badge}
        />
      )}
    </>
  ) : (
    <>
      {props.icon && (!props.iconPosition || props.iconPosition === 'left') && (
        <Icon
          icon={props.icon}
          size={size}
          className={cn(props.iconClassName)}
        />
      )}
      {props.label}
      {props.icon && props.iconPosition === 'right' ? (
        <Icon
          icon={props.icon}
          size={size}
          className={cn(props.iconClassName)}
        />
      ) : (
        props.tooltip && <Icon icon="information-line" size={size} />
      )}
      {props.badge && <Badge size={size} {...props.badge} />}
    </>
  );

  const commonProps = {
    className,
    role: 'tab' as const,
    id: tabId,
    'aria-selected': isTabActive,
    // Un seul panneau est rendu (celui de l'onglet actif) : seuls les onglets
    // actifs référencent un panneau existant via `aria-controls`.
    'aria-controls': isTabActive ? panelId : undefined,
    // Roving tabindex : l'onglet actif est focusable ; tant qu'aucun ne l'est
    // encore, le premier onglet monté prend le relais pour que le tablist
    // reste toujours atteignable au clavier.
    tabIndex:
      isTabActive || (activeTabId === null && firstTabId === tabId) ? 0 : -1,
    title: props.title,
    'data-test': props.dataTest,
  };

  const activateLinkOnSpace = (event: KeyboardEvent<HTMLAnchorElement>) => {
    // Les liens n'activent pas nativement sur Espace ; l'APG Tabs l'exige.
    if (event.key !== ' ') return;
    event.preventDefault();
    event.currentTarget.click();
  };

  const control =
    props.href !== undefined ? (
      <Link
        {...commonProps}
        href={props.href}
        scroll={false}
        onClick={props.onClick}
        onKeyDown={activateLinkOnSpace}
      >
        {content}
      </Link>
    ) : (
      <button
        {...commonProps}
        type="button"
        onClick={props.onClick}
        className={cn(commonProps.className, 'cursor-pointer')}
      >
        {content}
      </button>
    );

  return (
    <li
      role="presentation"
      className={cn('p-0', {
        'shrink-0': isCard,
        'w-48': isCard && size === 'md',
        'w-40': isCard && size === 'sm',
        'w-32': isCard && size === 'xs',
      })}
    >
      {props.tooltip ? (
        <Tooltip label={props.tooltip}>{control}</Tooltip>
      ) : (
        control
      )}
    </li>
  );
};

export const TabsPanel = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  const { activeTabId } = useTabsContext();

  return (
    <div
      role="tabpanel"
      id={activeTabId ? getPanelId(activeTabId) : undefined}
      aria-labelledby={activeTabId ?? undefined}
      className={cn('grow flex flex-col rounded-lg', className)}
      tabIndex={0}
    >
      {children}
    </div>
  );
};

Tabs.Tab = TabsTab;
Tabs.List = TabsList;
Tabs.Panel = TabsPanel;
