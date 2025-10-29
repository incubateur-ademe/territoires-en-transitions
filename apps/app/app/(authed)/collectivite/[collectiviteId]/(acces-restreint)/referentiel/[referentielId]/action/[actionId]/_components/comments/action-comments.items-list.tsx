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
      {/** Premier commentaire */}
      <ActionCommentItem
        comment={messages[0]}
        discussionId={discussion.id}
        discussionStatus={discussion.status as TActionDiscussionStatut}
      />

      {/** Commentaires collapsed si plus de 2 commentaires */}
    </div>
  );
};

export default ActionCommentsItemsList;
