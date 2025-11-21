import { useUser } from '@/api/users/user-context/user-provider';
import { canCreateDiscussion } from '@/app/referentiels/actions/comments/helpers/action-comments-helper';
import { DiscussionMessages } from '@/domain/collectivites';
import classNames from 'classnames';
import ActionCommentInput from './action-comments.input';
import ActionCommentsItemsList from './action-comments.items-list';
import { useAddDiscussion } from './hooks/use-add-discussion';

export type Props = {
  discussion: DiscussionMessages;
  title: string | undefined;
};

const ActionCommentDiscussion = ({ discussion, title }: Props) => {
  const { mutate: handleAddDiscussion } = useAddDiscussion();

  const user = useUser();

  const handleSave = (message: string) => {
    handleAddDiscussion({
      message,
      actionId: discussion.actionId,
      collectiviteId: discussion.collectiviteId,
      discussionId: discussion.id,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <ActionCommentsItemsList discussion={discussion} title={title} />
      {discussion.status === 'ouvert' && (
        <div
          className={classNames({ 'ml-10': discussion.messages.length > 0 })}
        >
          {canCreateDiscussion(user) && (
            <ActionCommentInput
              placeholder="Répondre"
              onSave={handleSave}
              onClose={() => {}}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ActionCommentDiscussion;
