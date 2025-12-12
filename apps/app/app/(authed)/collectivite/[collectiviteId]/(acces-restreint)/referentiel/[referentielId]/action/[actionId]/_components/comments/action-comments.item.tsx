import { buildActionLink } from '@/app/referentiels/actions/comments/helpers/action-comments-helper';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { getInitials, getModifiedSince } from '@/app/utils/formatUtils';
import { useCollectiviteId } from '@tet/api/collectivites';
import { useUser } from '@tet/api/users';
import { DiscussionMessage } from '@tet/domain/collectivites';
import { Button, Select } from '@tet/ui';
import Link from 'next/link';
import { useState } from 'react';
import ActionCommentNewInput from './action-comments.new-input';
import { ActionDiscussionStatut } from './action-comments.types';
import { useDeleteDiscussionMessage } from './hooks/use-delete-discussion-message';
import { useUpdateDiscussion } from './hooks/use-update-discussion';
import { useUpdateDiscussionMessage } from './hooks/use-update-discussion-message';
import RoundedVerticalBorder from './rounded-vertical-border';

const ActionCommentTitle = ({ title }: { title: string }) => (
  <div className="flex gap-2">
    <RoundedVerticalBorder />
    <div className="items-center">
      <span className="text-grey-6 text-xs font-medium">{title}</span>
    </div>
  </div>
);

type Props = {
  comment: DiscussionMessage;
  discussionId: number;
  discussionStatus: ActionDiscussionStatut;
  actionId: string;
  isFirstComment: boolean;
  title: string | undefined;
  isDisplayedAsPanel: boolean;
};

const ActionCommentItem = ({
  comment,
  discussionId,
  discussionStatus,
  actionId,
  isFirstComment,
  title,
  isDisplayedAsPanel,
}: Props) => {
  const creationDate = new Date(comment.createdAt);
  const [selectedStatus, setSelectedStatus] = useState<string>(
    discussionStatus ?? 'ouvert'
  );
  const [isEditingComment, setIsEditingComment] = useState(false);
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();
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

  const user = useUser();

  const canUpdateOrDeleteComment = user && user.id === comment.createdBy;

  const handleUpdateDiscussionStatus = async (
    status: ActionDiscussionStatut
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
        discussionId,
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

  const commentActionButtonsClassName = ' group-hover:flex gap-2 ml-auto p-3';

  return (
    <div className="group">
      <div className="flex items-start gap-3 justify-between">
        <div className="flex grow gap-2 w-full">
          <span className="shrink-0 h-7 w-7 flex items-center justify-center text-primary-0 text-sm font-bold leading-none rounded-full bg-primary-6">
            {getInitials(comment.createdByNom ?? '')}
          </span>

          {/* Content */}
          <div className=" flex flex-col gap-2 w-full">
            <div className="sm:h-7 flex sm:items-center gap-2 max-sm:flex-col justify-between">
              <div className="flex align-center items-center gap-2">
                <span className="shrink-0 text-primary-9 text-sm font-bold">
                  {comment.createdByPrenom} {comment.createdByNom}
                </span>
                <span className="text-grey-6 text-xs font-medium">
                  {getModifiedSince(creationDate.toISOString())}
                </span>
                {canUpdateOrDeleteComment && (
                  <div className="flex gap-2">
                    <Button
                      className={commentActionButtonsClassName}
                      dataTest="ActionEditDiscussionCommentaireMenu"
                      icon="pencil-line"
                      title="Editer mon commentaire"
                      variant="grey"
                      size="xs"
                      loading={isUpdatingDiscussionMessage}
                      disabled={isEditingComment}
                      onClick={() => {
                        if (!canUpdateOrDeleteComment) return;
                        setIsEditingComment(true);
                      }}
                    />
                    <Button
                      className={commentActionButtonsClassName}
                      dataTest="ActionDeleteDiscussionCommentaireMenu"
                      icon="delete-bin-6-line"
                      title="Supprimer mon commentaire"
                      variant="grey"
                      size="xs"
                      loading={isDeletingDiscussionMessage}
                      disabled={isDeletingDiscussionMessage}
                      onClick={() => {
                        void handleDeleteDiscussionMessage();
                      }}
                    />
                  </div>
                )}
              </div>
              {isFirstComment && (
                <div className="w-fit">
                  <Select
                    options={statusOptions}
                    values={selectedStatus}
                    disabled={isUpdatingDiscussion}
                    onChange={(value) => {
                      if (value) {
                        void handleUpdateDiscussionStatus(
                          value as ActionDiscussionStatut
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
            {title &&
              isFirstComment &&
              (!isDisplayedAsPanel ? (
                <Link
                  href={buildActionLink(
                    actionId,
                    referentielId,
                    collectiviteId
                  )}
                  target="_blank"
                  className="after:hidden bg-none"
                >
                  <ActionCommentTitle title={title} />
                </Link>
              ) : (
                <ActionCommentTitle title={title} />
              ))}

            {/* {!isEditingComment && (
              <p className="text-sm text-primary-10 whitespace-pre-wrap mb-0">
                {comment.message}
              </p>
            )} */}
            {/* {isEditingComment && (
              <ActionCommentInput
                message={comment.message}
                onSave={(value) => {
                  handleSaveComment(value);
                }}
                disabled={isUpdatingDiscussionMessage}
                onPublish={() => {
                  setIsEditingComment(false);
                }}
                autoFocus
              />
            )} */}

            <ActionCommentNewInput
              isEditingComment={isEditingComment}
              message={comment.message}
              onSave={(value) => {
                handleSaveComment(value);
              }}
              onCancel={() => {
                setIsEditingComment(false);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionCommentItem;
