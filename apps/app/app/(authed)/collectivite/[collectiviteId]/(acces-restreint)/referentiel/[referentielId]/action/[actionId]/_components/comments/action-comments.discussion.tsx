import { canCreateDiscussion } from '@/app/referentiels/actions/comments/helpers/action-comments-helper';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { DiscussionWithMessages } from '@tet/domain/collectivites';
import classNames from 'classnames';
import ActionCommentsItemsList from './action-comments.items-list';
import ActionNewDiscussionInput from './action-new-discussion-input';
import { useAddDiscussion } from './hooks/use-add-discussion';

export type Props = {
  discussion: DiscussionWithMessages;
  title: string | undefined;
  isDisplayedAsPanel: boolean;
};

const ActionCommentDiscussion = ({
  discussion,
  title,
  isDisplayedAsPanel,
}: Props) => {
  const { mutate: handleAddDiscussion } = useAddDiscussion();

  const currentCollectivite = useCurrentCollectivite();

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
      <ActionCommentsItemsList
        discussion={discussion}
        title={title}
        isDisplayedAsPanel={isDisplayedAsPanel}
      />
      {discussion.status === 'ouvert' && (
        <div
          className={classNames({ 'ml-10': discussion.messages.length > 0 })}
        >
          {canCreateDiscussion(currentCollectivite) && (
            <ActionNewDiscussionInput
              placeholder="Répondre"
              onSave={handleSave}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ActionCommentDiscussion;
