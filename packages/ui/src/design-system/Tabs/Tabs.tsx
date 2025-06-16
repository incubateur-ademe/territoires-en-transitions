import classNames from 'classnames';
import {
  Children,
  ReactElement,
  Ref,
  cloneElement,
  useEffect,
  useRef,
  useState,
} from 'react';

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
  /** Force le display quelle que soit la taille du composant */
  forceDisplay?: 'center' | 'left';
  /** Onglets */
  children: (ReactElement | undefined)[];
  /** Index (base 0) de l'onglet actif */
  defaultActiveTab?: number;
  /** Appelée quand l'onglet actif change */
  onChange?: (activeTab: number) => void;
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
  forceDisplay,
  onChange,
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

  const ref: Ref<HTMLUListElement> = useRef(null);
  const [componentWidth, setComponentWidth] = useState<number | undefined>();

  const componentBreakpoint = 1000;

  useEffect(() => {
    if (ref.current) {
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setComponentWidth(entry.contentRect.width);
        }
      });
      observer.observe(ref.current);

      // Cleanup function
      return () => observer.disconnect();
    }
  }, []);

  return (
    <div className={classNames(className)} data-test={dataTest}>
      <ul
        ref={ref}
        role="tablist"
        className={classNames(
          'w-full p-2 rounded-lg inline-flex gap-3 lg:gap-6 bg-grey-2 !list-none',
          {
            'justify-start overflow-x-auto pl-0':
              forceDisplay === 'left' ||
              (!forceDisplay &&
                componentWidth &&
                componentWidth > componentBreakpoint),
            'justify-center flex-wrap':
              forceDisplay === 'center' ||
              (!forceDisplay &&
                (!componentWidth || componentWidth <= componentBreakpoint)),
          },
          tabsListClassName
        )}
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
