import { ExpandPanel } from "ui/shared";

export const ActionCommentaire = (props: {
  content: string;
  width?: string;
}) => {
  if (!props.content) return <></>;
  return (
    <div
      className={`w-${props.width ?? "full"} border-t border-b border-gray-300`}
    >
      <ExpandPanel title="Commentaire" content={props.content} />
    </div>
  );
};
