// copié de https://github.com/dataesr/react-dsfr/blob/master/src/components/interface/Tabs/Tabs.js
import classNames from 'classnames';
import {
  cloneElement,
  Children,
  ReactElement,
  KeyboardEvent,
  useState,
  useEffect,
} from 'react';
//import '@gouvfr/dsfr/dist/component/tab/tab.css';

type TabsProps = {
  className?: string;
  children: (ReactElement | null)[];
  defaultActiveTab?: number;
  onChange?: (activeTab: number) => void;
};

/**
 *
 * @visibleName Tabs
 */
const Tabs = ({
  className,
  children,
  defaultActiveTab = 0,
  onChange,
  ...remainingProps
}: TabsProps) => {
  const [activeTab, setActiveTab] = useState(() => defaultActiveTab);
  const tabsPanel = Children.toArray(children).map((child, index) =>
    cloneElement(child as ReactElement, {
      activeTab,
      index,
    })
  );

  useEffect(() => {
    setActiveTab(defaultActiveTab);
  }, [defaultActiveTab]);

  const changeTab = (index: number) => {
    setActiveTab(index);
    if (onChange) {
      onChange(index);
    }
  };

  const onKeyDownTab = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    // Behavior from WAI-ARIA Authoring Practices 1.1
    // https://www.w3.org/TR/wai-aria-practices/#keyboard-interaction-19
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        changeTab((index + 1) % tabsPanel.length);
        break;

      case 'ArrowLeft':
        e.preventDefault();
        changeTab(index - 1 < 0 ? tabsPanel.length - 1 : index - 1);
        break;

      case 'Home':
        e.preventDefault();
        changeTab(0);
        break;

      case 'End':
        e.preventDefault();
        changeTab(tabsPanel.length - 1);
        break;

      default:
      // do nothing => apply normal behavior
    }
  };

  const _className = classNames('fr-tabs', className);
  return (
    <div className={_className} {...remainingProps}>
      <ul className="fr-tabs__list" role="tablist">
        {tabsPanel.map((element, index) => {
          const isActive = activeTab === index;
          const icon = element.props.icon
            ? `fr-icon-${element.props.icon}-${isActive ? 'fill' : 'line'}`
            : undefined;
          return (
            <li role="presentation" key={element.props.label}>
              <button
                type="button"
                role="tab"
                id={`fr-tab-${index}`}
                tabIndex={isActive ? 0 : -1}
                aria-selected={isActive ? 'true' : 'false'}
                aria-controls={`fr-tabpanel-${index}`}
                className={classNames('fr-tabs__tab', icon, {
                  'fr-tabs__tab--icon-left': icon,
                })}
                onClick={() => changeTab(index)}
                onKeyDown={(e) => onKeyDownTab(e, index)}
              >
                {element.props.label}
              </button>
            </li>
          );
        })}
      </ul>
      {tabsPanel}
    </div>
  );
};

export default Tabs;
