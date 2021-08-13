import { CrossExpandPanelWithHtmlContent } from "ui/shared";

export const ActionDescription = (props: {
  content: string;
  width?: string;
}) => {
  if (!props.content) return <></>;
  return (
    <div
      className={`w-${props.width ?? "full"} border-t border-b border-gray-300`}
    >
      <CrossExpandPanelWithHtmlContent
        title="Description"
        content={props.content}
      />
    </div>
  );
};
