// copié depuis https://github.com/dataesr/react-dsfr/blob/master/src/components/interface/Tabs/Tab.js
import classNames from 'classnames';

type TabChildren = React.ReactNode[] | React.ReactNode | string;

interface TabProps {
  className?: string;
  children?: TabChildren;
  index?: number;
  activeTab?: number;
  label: string;
  /**
   * Préfixe de l'icône associée à l'onglet. Si par exemple icon="archive" alors
   * l'icône associée sera "fr-icon-archive-line" quand l'onglet est inactif et
   * "fr-icon-archive-fill" quand il est actif
   */
  icon?: string;
}

const Tab = ({
  className,
  index,
  activeTab,
  children,
  ...remainingProps
}: TabProps) => (
  <div
    id={`fr-tabpanel-${index}`}
    className={classNames(
      'fr-tabs__panel border',
      { 'fr-tabs__panel--selected': activeTab === index },
      className
    )}
    role="tabpanel"
    aria-labelledby={`fr-tab-${index}`}
    tabIndex={index}
    {...remainingProps}
  >
    {index === activeTab ? children : null}
  </div>
);

export default Tab;
