import { DiscussionMessages } from '@/domain/collectivites';
import { cn } from '@/ui/utils/cn';
import ActionCommentItem from './action-comments.item';
import { ActionDiscussionStatut } from './action-comments.types';

type Props = {
  discussion: DiscussionMessages;
  title: string | undefined;
  isDisplayedAsPanel: boolean;
};

const ActionCommentsItemsList = ({
  discussion,
  title,
  isDisplayedAsPanel,
}: Props) => {
  return (
    <div className="flex flex-col gap-4">
      {discussion.messages.map((message, index) => (
        <div key={message.id} className={cn({ 'ml-10': index > 0 })}>
          <ActionCommentItem
            key={message.id}
            comment={message}
            discussionId={discussion.id}
            discussionStatus={discussion.status as ActionDiscussionStatut}
            isFirstComment={index === 0}
            title={title}
            actionId={discussion.actionId}
            isDisplayedAsPanel={isDisplayedAsPanel}
          />
        </div>
      ))}
    </div>
  );
};

export default ActionCommentsItemsList;
