import { IconValue } from '../Icon';

type TabChildren = React.ReactNode[] | React.ReactNode | string;

export interface TabProps {
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
  /** Picto optionnel affiché à gauche (par défaut) du libellé */
  icon?: IconValue;
  /** Permet de styler le picto */
  iconClassName?: string;
  /** Positionnement du picto par rapport au libellé */
  iconPosition?: 'left' | 'right';
  /** Permet de donner un contenu au survol du bouton de l'onglet (infobulle) */
  title?: string;
}

/**
 * Affiche le contenu d'un onglet
 */
export const Tab = ({
  className = '',
  index,
  activeTab = 0,
  children,
  iconPosition,
  iconClassName,
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
