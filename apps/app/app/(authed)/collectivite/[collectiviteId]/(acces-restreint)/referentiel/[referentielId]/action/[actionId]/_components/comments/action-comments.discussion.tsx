import { DiscussionMessages } from '@/domain/collectivites';
import ActionCommentInput from './action-comments.input';
import ActionCommentsItemsList from './action-comments.items-list';
import { useAddCommentaireToDiscussion } from './data/useAddCommentaireToDiscussion';

export type Props = {
  discussion: DiscussionMessages;
};

const ActionCommentDiscussion = ({ discussion }: Props) => {
  const { mutate: handleAddCommentaireToDiscussion } =
    useAddCommentaireToDiscussion(discussion.id);

  return (
    <div className="flex flex-col gap-6">
      <ActionCommentsItemsList discussion={discussion} />
      {discussion.status === 'ouvert' && (
        <ActionCommentInput
          placeholder="Répondre"
          onSave={handleAddCommentaireToDiscussion}
        />
      )}
    </div>
  );
};

export default ActionCommentDiscussion;
