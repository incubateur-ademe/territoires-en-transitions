import { useUser } from '@/api/users/user-context/user-provider';
import { DiscussionMessageType } from '@/domain/collectivites';
import { Button } from '@/ui';
import classNames from 'classnames';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TActionDiscussionStatut } from './action-comments.types';
import { useDeleteCommentaireFromDiscussion } from './data/useDeleteCommentaireFromDiscussion';
import { useUpdateDiscussionStatus } from './data/useUpdateDiscussionStatus';

type Props = {
  comment: DiscussionMessageType;
  /** À donner au premier commentaire d'une discussion afin qu'il puisse fermer / ouvrir la discussion */
  discussionId?: number;
  discussionStatus: TActionDiscussionStatut;
};

const ActionCommentItem = ({
  comment,
  discussionId,
  discussionStatus,
}: Props) => {
  const user = useUser();
  const creationDate = new Date(comment.createdAt);

  const { mutate: updateDiscussionStatus } = useUpdateDiscussionStatus();
  const { mutate: deleteCommentaire } = useDeleteCommentaireFromDiscussion();

  const handleUpdateDiscussionStatus = () => {
    if (discussionId) {
      updateDiscussionStatus({
        discussion_id: discussionId,
        status: discussionStatus === 'ouvert' ? 'ferme' : 'ouvert',
      });
    }
  };

  return (
    <div className="flex items-start gap-3">
      <span
        className={classNames(
          'shrink-0 h-7 w-7 flex items-center justify-center text-primary-0 text-sm font-bold leading-none rounded-full',
          {
            'bg-primary-6': discussionStatus === 'ouvert',
            'bg-primary-9': discussionStatus === 'ferme',
          }
        )}
      >
        {comment.createdByNom}
      </span>

      {/* Content */}
      <div className="grow flex flex-col">
        <div className="sm:h-7 flex sm:items-center gap-2 max-sm:flex-col">
          <span className="text-primary-9 text-sm font-bold">
            {comment.createdByNom}
          </span>
          <span className="text-grey-6 text-xs font-medium">
            {format(creationDate, 'dd/MM/y', { locale: fr })}
          </span>
        </div>
        <p
          className="text-sm text-primary-10 font-medium whitespace-pre-wrap mb-0"
          style={{ overflowWrap: 'anywhere' }}
        >
          {comment.message}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {discussionId && (
          <div className="shrink-0">
            <Button
              onClick={handleUpdateDiscussionStatus}
              variant="grey"
              size="xs"
            >
              {discussionStatus === 'ouvert' ? 'Fermer' : 'Rouvrir'}
            </Button>
          </div>
        )}
        {user && user.id === comment.createdBy && (
          <Button
            dataTest="ActionDiscussionCommentaireMenu"
            icon="delete-bin-6-line"
            title="Supprimer mon commentaire"
            variant="grey"
            size="xs"
            onClick={() => {
              deleteCommentaire(comment.id);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ActionCommentItem;
