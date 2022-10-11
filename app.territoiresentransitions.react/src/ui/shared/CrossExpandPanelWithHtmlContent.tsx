import {ChangeEvent, ReactNode} from 'react';
import DOMPurify from 'dompurify';

import './CrossExpandPanel.css';
import {Editable} from 'ui/shared/Editable';
import {useToggle} from './useToggle';

export const CrossExpandPanelWithHtmlContent = (props: {
  content: string;
  title: string;
  editable?: boolean;
}) => {
  const {content, ...otherProps} = props;

  return (
    <CrossExpandPanelWithNode {...otherProps}>
      <div
        className="content"
        dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(content)}}
      />
    </CrossExpandPanelWithNode>
  );
};

export const CrossExpandPanelWithNode = (props: {
  children: ReactNode;
  title: string;
  editable?: boolean;
}) => {
  const {children, title, editable} = props;
  const [opened, handleToggle] = useToggle(false);

  return (
    <div className="CrossExpandPanel">
      <details open={opened} onToggle={handleToggle}>
        <summary className="title">
          {editable ? <Editable text={title} /> : <div>{title}</div>}
        </summary>
        {opened ? children : null}
      </details>
    </div>
  );
};

export const CrossExpandPanelBase = (props: {
  children: ReactNode;
  title: string;
  editable?: boolean;
  opened: boolean;
  onToggle: (event: ChangeEvent<HTMLDetailsElement>) => void;
}) => {
  const {children, title, editable, opened, onToggle} = props;

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
