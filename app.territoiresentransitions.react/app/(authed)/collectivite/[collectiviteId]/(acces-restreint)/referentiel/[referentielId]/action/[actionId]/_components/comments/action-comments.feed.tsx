import { Divider } from '@/ui';
import { Fragment } from 'react';
import ActionCommentsEmptyImg from './action-comment.empty-img';
import ActionCommentDiscussion from './action-comments.discussion';
import { TActionDiscussionStatut } from './action-comments.types';
import { useActionDiscussionFeed } from './data/useActionDiscussionFeed';

type Props = {
  actionId: string;
  state: TActionDiscussionStatut;
};

const ActionCommentFeed = ({ actionId, state }: Props) => {
  const discussions = useActionDiscussionFeed({
    action_id: actionId,
    statut: state,
  });

  return (
    <div
      data-test="ActionDiscussionsFeed"
      className="flex flex-col gap-6 px-4 pb-20"
    >
      {discussions.length === 0 ? (
        <div className="flex flex-col gap-4 mt-32">
          <ActionCommentsEmptyImg className="mx-auto" />
          <p className="text-sm text-center text-grey-7">
            Aucun commentaire {state === 'ouvert' ? state : 'fermé'} pour
            l’instant
          </p>
        </div>
      ) : (
        discussions
          .filter((discussion) => discussion.commentaires)
          .map((discussion, idx) => (
            <Fragment key={discussion.id}>
              <ActionCommentDiscussion discussion={discussion} />
              {idx !== discussions.length - 1 && <Divider className="-mb-6" />}
            </Fragment>
          ))
      )}
    </div>
  );
};

export default ActionCommentFeed;
