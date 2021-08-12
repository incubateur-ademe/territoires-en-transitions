import { ExpandPanel } from "ui/shared";

export const ActionDescription = (props: { content: string }) => {
  if (!props.content) return <></>;
  return (
    <div className="w-1/2 border-t border-b border-gray-300">
      <ExpandPanel title="Description" content={props.content} />
    </div>
  );
};
