// copié depuis https://github.com/dataesr/react-dsfr/blob/master/src/components/interface/Tabs/Tab.js
import classNames from 'classnames';

type TabChildren = React.ReactNode[] | React.ReactNode | string;

interface TabProps {
  className?: string;
  children?: TabChildren;
  index?: number;
  activeTab?: number;
  label: string;
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
      'fr-tabs__panel',
      {'fr-tabs__panel--selected': activeTab === index},
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

Tab.defaultProps = {
  className: '',
  icon: '',
};

export default Tab;
