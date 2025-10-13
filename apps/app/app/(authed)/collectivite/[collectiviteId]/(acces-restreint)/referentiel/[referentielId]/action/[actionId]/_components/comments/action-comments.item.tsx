import { useCollectiviteId } from '@/api/collectivites';
import { getInitials, getModifiedSince } from '@/app/utils/formatUtils';
import { DiscussionMessage } from '@/domain/collectivites';
import { Button, Select } from '@/ui';
import classNames from 'classnames';
import { useState } from 'react';
import ActionCommentInput from './action-comments.input';
import { TActionDiscussionStatut } from './action-comments.types';
import { useDeleteDiscussionMessage } from './hooks/use-delete-discussion-message';
import { useUpdateDiscussion } from './hooks/use-update-discussion';
import { useUpdateDiscussionMessage } from './hooks/use-update-discussion-message';
import { useUserPermissions } from './hooks/use-user-permissions';
import RoundedVerticalBorder from './rounded-vertical-border';

type Props = {
  comment: DiscussionMessage;
  discussionId: number;
  discussionStatus: TActionDiscussionStatut;
  isFirstComment: boolean;
  title: string | undefined;
};

const ActionCommentItem = ({
  comment,
  discussionId,
  discussionStatus,
  isFirstComment,
  title,
}: Props) => {
  const creationDate = new Date(comment.createdAt);
  const [selectedStatus, setSelectedStatus] = useState<string>(
    discussionStatus ?? 'ouvert'
  );
  const [isEditingComment, setIsEditingComment] = useState(false);
  const collectiviteId = useCollectiviteId();
  const { canDeleteComment } = useUserPermissions(comment.createdBy);
  const {
    mutateAsync: updateDiscussionMessage,
    isPending: isUpdatingDiscussionMessage,
  } = useUpdateDiscussionMessage();
  const { mutateAsync: updateDiscussion, isPending: isUpdatingDiscussion } =
    useUpdateDiscussion();
  const {
    mutateAsync: deleteDiscussionMessage,
    isPending: isDeletingDiscussionMessage,
  } = useDeleteDiscussionMessage();

  const handleUpdateDiscussionStatus = async (
    status: TActionDiscussionStatut
  ) => {
    if (!collectiviteId) return;

    const previousStatus = selectedStatus;
    setSelectedStatus(status);

    try {
      await updateDiscussion({
        discussionId,
        collectiviteId,
        status,
      });
    } catch {
      setSelectedStatus(previousStatus);
    }
  };

  const handleDeleteDiscussionMessage = async () => {
    if (!collectiviteId) return;

    try {
      await deleteDiscussionMessage({
        messageId: comment.id,
        collectiviteId,
      });
    } catch {
      // Les toasts d'erreur sont gérés globalement
    }
  };

  const handleSaveComment = async (value: string) => {
    if (!collectiviteId) return;

    try {
      await updateDiscussionMessage({
        messageId: comment.id,
        collectiviteId,
        message: value,
      });
      setIsEditingComment(false);
    } catch {
      setIsEditingComment(true);
      // Les toasts d'erreur sont gérés globalement
    }
  };

  const statusOptions = [
    { label: 'ouvert', value: 'ouvert' },
    { label: 'fermé', value: 'ferme' },
  ];

  return (
    <div className="group">
      <div className="flex items-start gap-3 justify-between">
        <div className="flex gap-2">
          <span
            className={classNames(
              'shrink-0 h-7 w-7 flex items-center justify-center text-primary-0 text-sm font-bold leading-none rounded-full',
              {
                'bg-primary-6': discussionStatus === 'ouvert',
                'bg-primary-9': discussionStatus === 'ferme',
              }
            )}
          >
            {getInitials(comment.createdByNom ?? '')}
          </span>

          {/* Content */}
          <div className=" flex flex-col gap-2">
            <div className="sm:h-7 flex sm:items-center gap-2 max-sm:flex-col">
              <span className="text-primary-9 text-sm font-bold">
                {comment.createdByNom}
              </span>
              <span className="text-grey-6 text-xs font-medium">
                {getModifiedSince(creationDate.toISOString())}
              </span>
              {canDeleteComment && (
                <Button
                  className="invisible opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 focus-visible:visible focus-visible:opacity-100"
                  dataTest="ActionDiscussionCommentaireMenu"
                  icon="delete-bin-6-line"
                  title="Supprimer mon commentaire"
                  variant="outlined"
                  size="xs"
                  loading={isDeletingDiscussionMessage}
                  disabled={isDeletingDiscussionMessage}
                  onClick={() => {
                    void handleDeleteDiscussionMessage();
                  }}
                />
              )}
            </div>
            {title && isFirstComment && (
              <div className="flex gap-2">
                <RoundedVerticalBorder />
                <div className="items-center">
                  <span className="text-grey-6 text-xs font-medium">
                    {title}
                  </span>
                </div>
              </div>
            )}
            <p
              className="text-sm text-primary-10 font-medium whitespace-pre-wrap mb-0 cursor-pointer"
              style={{ overflowWrap: 'anywhere' }}
              title="Editer mon commentaire"
              onClick={() => {
                setIsEditingComment(!isEditingComment);
              }}
            >
              {comment.message}
            </p>
            {isEditingComment && (
              <ActionCommentInput
                message={comment.message}
                onSave={(value) => {
                  void handleSaveComment(value);
                }}
                disabled={isUpdatingDiscussionMessage}
              />
            )}
          </div>
        </div>
        {isFirstComment && (
          <div className="flex items-center gap-2 ">
            {discussionId && (
              <div className="shrink-0">
                <Select
                  options={statusOptions}
                  values={selectedStatus}
                  disabled={isUpdatingDiscussion}
                  onChange={(value) => {
                    if (value) {
                      void handleUpdateDiscussionStatus(
                        value as TActionDiscussionStatut
                      );
                    }
                  }}
                  customItem={(v) => (
                    <span className="text-primary font-bold">{v.label}</span>
                  )}
                  small
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionCommentItem;
