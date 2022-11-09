import {useAutoSizeTextarea} from 'ui/shared/useAutoSizeTextarea';

type Props = {
  commentaire: string;
  onChange: (value: string) => void;
  placeholder: string;
};

/** Composant réutilisable pour les différents champs de saisie présents dans la fonctionnalité "Commentaire" */
const ActionDiscussionTextarea = ({
  commentaire,
  onChange,
  placeholder,
}: Props) => {
  // Appelée au changement de valeur du textarea
  const textAreaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  const textareaRef = useAutoSizeTextarea(commentaire, '2.25rem');

  return (
    <div className="flex rounded-lg bg-white border border-white">
      <textarea
        ref={textareaRef}
        className="w-full py-2 px-3 text-sm cursor-text rounded-lg outline !outline-1 outline-gray-300 focus:outline-blue-500"
        placeholder={placeholder}
        onChange={textAreaChange}
        value={commentaire}
      />
    </div>
  );
};

export default ActionDiscussionTextarea;
