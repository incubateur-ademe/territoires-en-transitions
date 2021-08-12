import "./ExpandPanel.css";

export const ExpandPanel = (props: {
  content: string;
  title: string;
  className?: string;
}) => (
  <details className={props.className}>
    <summary className="title">{props.title}</summary>
    <div
      className="content"
      dangerouslySetInnerHTML={{ __html: props.content }}
    />
  </details>
);
