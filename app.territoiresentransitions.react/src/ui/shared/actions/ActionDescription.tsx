import { CrossExpandPanelWithHtmlContent } from "ui/shared";

export const ActionDescription = (props: { content: string }) => {
  if (!props.content) return <></>;
  return (
    <div className={`border-t border-b border-gray-300`}>
      <CrossExpandPanelWithHtmlContent
        title="Description"
        content={props.content}
      />
    </div>
  );
};
