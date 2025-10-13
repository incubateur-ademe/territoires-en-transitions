import { DiscussionMessages } from '@/domain/collectivites';
import classNames from 'classnames';
import ActionCommentItem from './action-comments.item';
import { TActionDiscussionStatut } from './action-comments.types';

type Props = {
  discussion: DiscussionMessages;
  title: string | undefined;
};

const ActionCommentsItemsList = ({ discussion, title }: Props) => {
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
            isFirstComment={index === 0}
            title={title}
          />
        </div>
      ))}
    </div>
  );
};

export default ActionCommentsItemsList;
