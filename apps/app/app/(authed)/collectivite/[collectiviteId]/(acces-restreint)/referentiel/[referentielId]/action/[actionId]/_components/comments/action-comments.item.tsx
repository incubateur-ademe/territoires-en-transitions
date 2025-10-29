import { useCollectiviteId } from '@/api/collectivites';
import { getInitials, getModifiedSince } from '@/app/utils/formatUtils';
import { DiscussionMessage } from '@/domain/collectivites';
import { Select } from '@/ui';
import classNames from 'classnames';
import { useState } from 'react';
import { TActionDiscussionStatut } from './action-comments.types';
import { useUpdateDiscussion } from './hooks/useUpdateDiscussion';

type Props = {
  comment: DiscussionMessage;
  discussionId: number;
  discussionStatus: TActionDiscussionStatut;
  isFirstComment: boolean;
};

const ActionCommentItem = ({
  comment,
  discussionId,
  discussionStatus,
  isFirstComment,
}: Props) => {
  const creationDate = new Date(comment.createdAt);
  const [selectedStatus, setSelectedStatus] = useState<string>(
    discussionStatus ?? 'ouvert'
  );
  const collectiviteId = useCollectiviteId();

  const { mutate: updateDiscussion } = useUpdateDiscussion();

  const handleUpdateDiscussionStatus = (status: TActionDiscussionStatut) => {
    updateDiscussion({
      discussionId,
      collectiviteId,
      status,
    });
    setSelectedStatus(status);
  };

  const statusOptions = [
    { label: 'ouvert', value: 'ouvert' },
    { label: 'fermé', value: 'ferme' },
  ];

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
        {getInitials(comment.createdByNom ?? '')}
      </span>

      {/* Content */}
      <div className="grow flex flex-col">
        <div className="sm:h-7 flex sm:items-center gap-2 max-sm:flex-col">
          <span className="text-primary-9 text-sm font-bold">
            {comment.createdByNom}
          </span>
          <span className="text-grey-6 text-xs font-medium">
            {getModifiedSince(creationDate.toISOString())}
          </span>
        </div>
        <p
          className="text-sm text-primary-10 font-medium whitespace-pre-wrap mb-0"
          style={{ overflowWrap: 'anywhere' }}
        >
          {comment.message}
        </p>
      </div>

      {isFirstComment && (
        <div className="flex items-center gap-2">
          {discussionId && (
            <div className="shrink-0">
              <Select
                options={statusOptions}
                values={selectedStatus}
                onChange={(value) => {
                  if (value) {
                    handleUpdateDiscussionStatus(
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
  );
};

export default ActionCommentItem;
