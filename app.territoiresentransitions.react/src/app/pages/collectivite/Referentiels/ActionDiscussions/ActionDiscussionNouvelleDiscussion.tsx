import {useState} from 'react';
import Textarea from 'ui/shared/form/Textarea';
import {useAddDiscussionToAction} from './data/useAddDiscussionToAction';

type Props = {
  actionId: string;
};

/** Input permettant de créer une nouvelle discussion dans une action */
const ActionDiscussionNouvelleDiscussion = ({actionId}: Props) => {
  const [commentaire, setCommentaire] = useState<string>('');

  const {mutate: handleCreateDiscussion} = useAddDiscussionToAction(actionId);

  return (
    <div
      data-test="ActionDiscussionsNouvelleDiscussion"
      className="py-3 px-4 bg-gray-100"
    >
      <Textarea
        className="bg-white"
        value={commentaire}
        onInputChange={setCommentaire}
        placeholder="Écrire un nouveau commentaire..."
      />

      {commentaire.trim().length > 0 && (
        <div className="mt-4 ml-2">
          <button
            className="fr-btn"
            onClick={() => {
              setCommentaire('');
              handleCreateDiscussion(commentaire);
            }}
          >
            Publier
          </button>
        </div>
      )}
    </div>
  );
};

export default ActionDiscussionNouvelleDiscussion;
