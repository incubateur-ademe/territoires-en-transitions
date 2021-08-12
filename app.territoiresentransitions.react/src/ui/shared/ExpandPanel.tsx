export const ExpandPanel = (props: { content: string; title: string }) => (
  <details>
    <summary>{props.title}</summary>
    <div>{props.content}</div>
  </details>
);
