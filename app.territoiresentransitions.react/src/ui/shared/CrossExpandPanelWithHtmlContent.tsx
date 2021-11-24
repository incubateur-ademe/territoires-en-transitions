import {Editable} from 'ui/shared';
import {addTargetToContentAnchors} from 'utils/content';
import './CrossExpandPanel.css';

export const CrossExpandPanelWithHtmlContent = (props: {
  content: string;
  title: string;
  editable?: boolean;
}) => (
  <div className="CrossExpandPanel">
    <details className="htmlContent">
      <summary className="title">
        {props.editable ? (
          <Editable text={props.title} />
        ) : (
          <div>{props.title}</div>
        )}
      </summary>
      <div
        className="content"
        dangerouslySetInnerHTML={{
          __html: addTargetToContentAnchors(props.content),
        }}
      />
    </details>
  </div>
);
