import { DiscussionMessages } from '@/domain/collectivites';
import classNames from 'classnames';
import ActionCommentInput from './action-comments.input';
import ActionCommentsItemsList from './action-comments.items-list';
import { useAddDiscussion } from './hooks/use-add-discussion';
import { useUserRoles } from './hooks/use-user-roles';

export type Props = {
  discussion: DiscussionMessages;
  title: string | undefined;
};

const ActionCommentDiscussion = ({ discussion, title }: Props) => {
  const { mutate: handleAddDiscussion } = useAddDiscussion();

  const { canCreateDiscussion } = useUserRoles();

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
          {canCreateDiscussion && (
            <ActionCommentInput placeholder="Répondre" onSave={handleSave} />
          )}
        </div>
      )}
    </div>
  );
};

export default ActionCommentDiscussion;
