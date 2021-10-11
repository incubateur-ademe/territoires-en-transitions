export const Editable = (props: {text: string}) => (
  <div className="flex gap-2">
    {props.text} <div className="fr-fi-edit-line text-xs opacity-60" />
  </div>
);
