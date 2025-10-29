import { DiscussionMessages } from '@/domain/collectivites';
import classNames from 'classnames';
import ActionCommentInput from './action-comments.input';
import ActionCommentsItemsList from './action-comments.items-list';
import { useAddDiscussion } from './hooks/useAddDiscussion';

export type Props = {
  discussion: DiscussionMessages;
};

const ActionCommentDiscussion = ({ discussion }: Props) => {
  // const { mutate: handleAddCommentaireToDiscussion } =
  //   useAddCommentaireToDiscussion(discussion.id);

  const { mutate: handleAddDiscussion } = useAddDiscussion(discussion.actionId);

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
      <ActionCommentsItemsList discussion={discussion} />
      {discussion.status === 'ouvert' && (
        <div
          className={classNames({ 'ml-10': discussion.messages.length > 0 })}
        >
          <ActionCommentInput placeholder="Répondre" onSave={handleSave} />
        </div>
      )}
    </div>
  );
};

export default ActionCommentDiscussion;
