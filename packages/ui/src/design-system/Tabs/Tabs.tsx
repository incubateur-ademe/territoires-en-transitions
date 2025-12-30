import classNames from 'classnames';
import {
  Children,
  cloneElement,
  ReactElement,
  useEffect,
  useState,
} from 'react';

import { cn } from '../../utils/cn';
import { Icon } from '../Icon';

export type TabSize = 'xs' | 'sm' | 'md';

type TabsProps = {
  'data-test'?: string;
  /** Permet d'ajuster les styles du container */
  className?: string;
  /** Permet d'ajuster les styles de la liste d'onglets */
  tabsListClassName?: string;
  /** Permet d'ajuster les styles de tous les conteneurs d'onglets */
  tabPanelClassName?: string;
  /** Taille des boutons */
  size?: TabSize;
  /** Onglets */
  children: (ReactElement | undefined)[];
  /** Index (base 0) de l'onglet actif */
  defaultActiveTab?: number;
  /** Appelée quand l'onglet actif change */
  onChange?: (activeTab: number) => void;
  /**
   * Permet de choisir le layout des onglets lorsque l'écran est trop petit.
   * @default 'scroll'
   * @description 'scroll' : permet de faire un scroll horizontal des onglets
   * @description 'wrap' : permet de faire un wrap des onglets (en plusieurs lignes)
   */
  layoutOnOverflow?: 'scroll' | 'wrap';
};

/**
 *  Affiche un groupe d'onglets.
 */
export const Tabs = ({
  'data-test': dataTest,
  className,
  tabsListClassName,
  tabPanelClassName,
  children: childrenBase,
  defaultActiveTab = 0,
  size = 'md',
  onChange,
  layoutOnOverflow = 'scroll',
}: TabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultActiveTab);

  // synchronise l'état interne
  useEffect(() => {
    setActiveTab(defaultActiveTab);
  }, [defaultActiveTab]);

  // gère le clic sur un onglet
  const handleChange = (index: number) => {
    if (index !== activeTab) {
      setActiveTab(index);
      onChange?.(index);
    }
  };

  // copie le contenu des panneaux en ajoutant les props nécessaire
  const children = childrenBase.filter(Boolean);
  const tabsPanel = Children.toArray(children).map((child, index) =>
    cloneElement(child as ReactElement, {
      activeTab,
      index,
      className: tabPanelClassName,
    })
  );

  return (
    <div className={cn(className)} data-test={dataTest}>
      <ul
        className={cn(
          'flex rounded-lg bg-grey-2 p-2 gap-x-3 w-full list-none justify-start',
          {
            // Wrap layout (default): allows multi-line
            'flex-wrap justify-start gap-y-2': layoutOnOverflow === 'wrap',
            // Scroll layout: single line with horizontal scroll
            'flex-nowrap overflow-x-auto justify-center':
              layoutOnOverflow === 'scroll',
          },
          tabsListClassName
        )}
        role="tablist"
      >
        {children.map((element, index) => {
          const isActive = activeTab === index;
          if (!element) return;
          return (
            <li role="presentation" className="p-0" key={element.props.label}>
              <button
                className={classNames(
                  // styles communs
                  'flex items-center px-3 py-1 font-bold w-max',
                  // variante au survol
                  'hover:rounded-md hover:shadow-button hover:!bg-primary-2 hover:text-primary-9',
                  {
                    // variante de taille
                    'text-md': size === 'md',
                    'text-sm': size === 'sm',
                    'text-xs': size === 'xs',
                    // variante pour l'onglet actif
                    'border border-grey-3 rounded-md shadow-button bg-white text-primary-9':
                      isActive,
                    // variante pour les onglets inactifs
                    'text-primary-10': !isActive,
                  }
                )}
                type="button"
                role="tab"
                id={`tab-${index}`}
                aria-selected={isActive ? 'true' : 'false'}
                title={element.props.title}
                onClick={() => handleChange(index)}
              >
                {element.props.icon &&
                  (!element.props.iconPosition ||
                    element.props.iconPosition === 'left') && (
                    <Icon
                      icon={element.props.icon}
                      size={size}
                      className={classNames(
                        'mr-1',
                        element.props.iconClassName
                      )}
                    />
                  )}
                {element.props.label}
                {element.props.icon &&
                  element.props.iconPosition === 'right' && (
                    <Icon
                      icon={element.props.icon}
                      size={size}
                      className={classNames(
                        'ml-1',
                        element.props.iconClassName
                      )}
                    />
                  )}
              </button>
            </li>
          );
        })}
      </ul>
      {tabsPanel}
    </div>
  );
};
