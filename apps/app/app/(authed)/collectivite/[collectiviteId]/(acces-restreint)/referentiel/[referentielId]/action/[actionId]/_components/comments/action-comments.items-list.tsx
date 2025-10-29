import { DiscussionMessages } from '@/domain/collectivites';
import classNames from 'classnames';
import { useState } from 'react';
import ActionCommentItem from './action-comments.item';
import { TActionDiscussionStatut } from './action-comments.types';

type Props = {
  discussion: DiscussionMessages;
};

const ActionCommentsItemsList = ({ discussion }: Props) => {
  const { messages, status } = discussion;

  const [areCommentsExtended, setAreCommentsExtended] = useState(false);

  return (
    <div
      className={classNames('flex flex-col gap-4', {
        'bg-info-2 rounded-lg -m-2 p-2': discussion.status === 'ferme',
      })}
    >
      {discussion.messages.map((message, index) => (
        <div key={message.id} className={classNames({ 'ml-10': index > 0 })}>
          <ActionCommentItem
            key={message.id}
            comment={message}
            discussionId={discussion.id}
            discussionStatus={discussion.status as TActionDiscussionStatut}
          />
        </div>
      ))}
    </div>
  );
};

export default ActionCommentsItemsList;
