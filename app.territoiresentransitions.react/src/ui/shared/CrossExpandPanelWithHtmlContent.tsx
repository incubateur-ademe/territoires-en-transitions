import {ChangeEvent, ReactNode, useState} from 'react';
import './CrossExpandPanel.css';
import {Editable} from 'ui/shared/Editable';

export const CrossExpandPanelWithHtmlContent = (props: {
  content: string;
  title: string;
  editable?: boolean;
}) => {
  const {content, ...otherProps} = props;

  return (
    <CrossExpandPanelWithNode {...otherProps}>
      <div className="content" dangerouslySetInnerHTML={{__html: content}} />
    </CrossExpandPanelWithNode>
  );
};

export const CrossExpandPanelWithNode = (props: {
  children: ReactNode;
  title: string;
  editable?: boolean;
}) => {
  const {children, title, editable} = props;
  const [opened, setOpened] = useState(false);

  const onToggle = (event: ChangeEvent<HTMLDetailsElement>) => {
    event.preventDefault();
    setOpened(!opened);
  };

  return (
    <div className="CrossExpandPanel">
      <details className="htmlContent" open={opened} onToggle={onToggle}>
        <summary className="title">
          {editable ? <Editable text={title} /> : <div>{title}</div>}
        </summary>
        {opened ? children : null}
      </details>
    </div>
  );
};
