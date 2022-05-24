// recopié/adapté de react-dsfr pour gérer une prop. onChange
// https://github.com/dataesr/react-dsfr/blob/master/src/components/interface/Tabs/Tabs.js
import React, {
  cloneElement,
  useState,
  Children,
  ReactElement,
  KeyboardEvent,
} from 'react';

type TabsProps = {
  className?: string;
  children: ReactElement[];
  defaultActiveTab?: number;
  onChange: (activeTab: number) => void;
};

const Tabs = ({className, children, defaultActiveTab, onChange}: TabsProps) => {
  const [activeTab, setActiveTab] = useState(() => defaultActiveTab);

  const tabsPanel = Children.toArray(children).map((child, index) =>
    cloneElement(child as ReactElement, {
      activeTab,
      index,
    })
  );

  const handleChange = (tabIndex: number) => {
    onChange(tabIndex);
    setActiveTab(tabIndex);
  };

  const onKeyDownTab = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    // Behavior from WAI-ARIA Authoring Practices 1.1
    // https://www.w3.org/TR/wai-aria-practices/#keyboard-interaction-19
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        handleChange((index + 1) % tabsPanel.length);
        break;

      case 'ArrowLeft':
        e.preventDefault();
        handleChange(index - 1 < 0 ? tabsPanel.length - 1 : index - 1);
        break;

      case 'Home':
        e.preventDefault();
        handleChange(0);
        break;

      case 'End':
        e.preventDefault();
        handleChange(tabsPanel.length - 1);
        break;

      default:
      // do nothing => apply normal behavior
    }
  };

  const _className = `fr-tabs ${className || ''}`;
  return (
    <div className={_className}>
      <ul className="fr-tabs__list" role="tablist">
        {tabsPanel.map((element, index) => (
          <li role="presentation" key={element.props.label}>
            <button
              type="button"
              role="tab"
              id={`fr-tab-${index}`}
              aria-selected={activeTab === index ? 'true' : 'false'}
              tabIndex={activeTab === index ? 0 : -1}
              aria-controls={`fr-tabpanel-${index}`}
              className="fr-tabs__tab"
              onClick={() => handleChange(index)}
              onKeyDown={e => onKeyDownTab(e, index)}
            >
              {element.props.label}
            </button>
          </li>
        ))}
      </ul>
      {tabsPanel}
    </div>
  );
};

Tabs.defaultProps = {
  className: '',
  defaultActiveTab: 0,
};

export default Tabs;
