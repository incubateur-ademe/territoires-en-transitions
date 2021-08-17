import './CrossExpandPanel.css';

export const CrossExpandPanelWithHtmlContent = (props: {
  content: string;
  title: string;
  className?: string;
}) => (
  <div className="CrossExpandPanel">
    <details className={props.className}>
      <summary className="title">{props.title}</summary>
      <div
        className="content"
        dangerouslySetInnerHTML={{__html: props.content}}
      />
    </details>
  </div>
);
