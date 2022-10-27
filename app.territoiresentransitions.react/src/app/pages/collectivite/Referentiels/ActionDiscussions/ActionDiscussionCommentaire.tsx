import {format} from 'date-fns';
import {fr} from 'date-fns/locale';
import ActionDiscussionCommentaireDropdown from './ActionDiscussionCommentaireDropdown';

import {useAuth} from 'core-logic/api/auth/AuthProvider';
import {
  TActionDiscussion,
  TActionDiscussionCommentaire,
  TActionDiscussionStatut,
} from './data/types';
import {useUpdateDiscussionStatus} from './data/useUpdateDiscussionStatus';

type Props = {
  commentaire: TActionDiscussionCommentaire;
  /** À donner au premier commentaire d'une discussion afin qu'il puisse fermer la discussion */
  discussion?: TActionDiscussion;
};

/** Commentaire attaché à une discussion dans une action */
const ActionDiscussionCommentaire = ({commentaire, discussion}: Props) => {
  const {user} = useAuth();

  const creationDate = new Date(commentaire.created_at);

  const {mutate} = useUpdateDiscussionStatus();

  const handleUpdateDiscussionStatus = (
    id: number,
    statut: TActionDiscussionStatut
  ) => {
    if (statut === 'ouvert') {
      mutate({
        discussion_id: id,
        status: 'ferme',
      });
    }
    if (statut === 'ferme') {
      mutate({
        discussion_id: id,
        status: 'ouvert',
      });
    }
  };

  return (
    <div className="flex items-start mb-4">
      <div className="grow mr-4">
        <div className="flex items-center mb-1">
          <span className="h-5 w-5 flex items-center justify-center text-sm leading-none rounded-full border border-gray-900">
            {/* {commentaire.created_by_nom[0]} */}R
          </span>
          <span className="mx-2 font-bold text-sm">
            {commentaire.created_by_nom}Fake nom
          </span>
          <span className="text-gray-400 text-sm">
            {format(creationDate, 'd MMMM y', {locale: fr})}
          </span>
        </div>
        <div className="text-sm whitespace-pre-wrap">{commentaire.message}</div>
      </div>
      <div className="flex items-center">
        {user && user.id === discussion?.created_by && (
          <div className="shrink-0 mr-1 border border-gray-200">
            <button
              onClick={() =>
                handleUpdateDiscussionStatus(discussion.id, discussion.status)
              }
              className="py-1 px-2 text-sm hover:bg-gray-100"
            >
              {discussion.status === 'ouvert' && 'Fermer'}
              {discussion.status === 'ferme' && 'Rouvrir'}
            </button>
          </div>
        )}
        {user && user.id === commentaire.created_by && (
          <ActionDiscussionCommentaireDropdown
            commentaire_id={commentaire.id}
          />
        )}
      </div>
    </div>
  );
};

export default ActionDiscussionCommentaire;
