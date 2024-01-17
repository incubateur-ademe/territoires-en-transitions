import {IconValue} from '@design-system/icons/Icon';

type TabChildren = React.ReactNode[] | React.ReactNode | string;

interface TabProps {
  /** Permet d'ajuster les styles du conteneur */
  className?: string;
  /** Contenu de l'onglet */
  children?: TabChildren;
  /** Index de l'onglet (injecté par le composant `Tabs` parent) */
  index?: number;
  /** Index de l'onglet actif (injecté par le composant `Tabs` parent) */
  activeTab?: number;
  /** Libellé de l'onglet (injecté dans le composant `Tabs`) */
  label: string;
  /** Picto optionnel affiché à gauche du libellé */
  icon?: IconValue;
}

/**
 * Affiche le contenu d'un onglet
 */
export const Tab = ({
  className,
  index,
  activeTab = 0,
  children,
  ...remainingProps
}: TabProps) =>
  index === activeTab && (
    <div
      id={`tabpanel-${index}`}
      key={`tabpanel-${index}`}
      className={className}
      role="tabpanel"
      aria-labelledby={`tab-${index}`}
      tabIndex={index}
      {...remainingProps}
    >
      {children}
    </div>
  );

Tab.defaultProps = {
  activeTab: 0,
  className: '',
};
