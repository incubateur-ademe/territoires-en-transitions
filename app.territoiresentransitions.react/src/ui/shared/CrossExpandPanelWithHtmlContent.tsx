import './CrossExpandPanel.css';
import {ReactNode} from 'react';
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

  return (
    <div className="CrossExpandPanel">
      <details className="htmlContent">
        <summary className="title">
          {editable ? <Editable text={title} /> : <div>{title}</div>}
        </summary>
        {children}
      </details>
    </div>
  );
};
