import {useState} from 'react';
import Textarea from 'ui/shared/form/Textarea';
import ActionDiscussionCommentaire from './ActionDiscussionCommentaire';
import {TActionDiscussion} from './data/types';
import {useAddCommentaireToDiscussion} from './data/useAddCommentaireToDiscussion';

export type ActionDiscussionProps = {
  discussion: TActionDiscussion;
};

/** Discussion contenant des commentaires et un champ de saisie pour répondre */
const ActionDiscussion = ({discussion}: ActionDiscussionProps) => {
  const [nouveauCommentaire, setNouveauCommentaire] = useState<string>('');

  const {mutate: handleAddCommentaireToDiscussion} =
    useAddCommentaireToDiscussion(discussion.id);

  return (
    <div className="border-b border-gray-200">
      <div className="p-4 border-l-4 border-yellow-400">
        <ActionDiscussionCommentaireListe discussion={discussion} />
        {discussion.status === 'ouvert' && (
          <Textarea
            className="resize-none"
            value={nouveauCommentaire}
            onInputChange={setNouveauCommentaire}
            placeholder="Répondre..."
          />
        )}
        {nouveauCommentaire.trim().length > 0 && (
          <div className="mt-4 ml-2">
            <button
              className="fr-btn"
              onClick={() => {
                setNouveauCommentaire('');
                handleAddCommentaireToDiscussion(nouveauCommentaire);
              }}
            >
              Publier
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionDiscussion;

/**
 * Liste de commentaires pouvant comporter des commentaires masqués
 */
const ActionDiscussionCommentaireListe = ({
  discussion,
}: {
  discussion: TActionDiscussion;
}) => {
  const {commentaires} = discussion;

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      {/** Premier commentaire */}
      <ActionDiscussionCommentaire
        commentaire={commentaires[0]}
        discussion={discussion}
      />
      {/** Commentaire(s) masqué(s) */}
      {commentaires.length > 2 &&
        (isOpen ? (
          commentaires.map(
            (c, index) =>
              index > 0 &&
              index < commentaires.length - 1 && (
                <ActionDiscussionCommentaire key={c.id} commentaire={c} />
              )
          )
        ) : (
          <div className="inline-flex mb-4 border-b border-bf500">
            <button
              className="flex text-sm text-bf500 hover:!bg-none"
              onClick={() => setIsOpen(true)}
            >
              {commentaires.length - 2} autre
              {commentaires.length === 3 ? '' : 's'} réponse
              {commentaires.length === 3 ? '' : 's'}
              <div className="fr-fi-arrow-down-s-line scale-75" />
            </button>
          </div>
        ))}
      {/** Suite des commentaires */}
      {commentaires.length > 1 && (
        <ActionDiscussionCommentaire
          commentaire={commentaires[commentaires.length - 1]}
        />
      )}
    </div>
  );
};
