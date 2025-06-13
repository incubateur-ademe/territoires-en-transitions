import noCommentIllustration from '@/app/app/static/img/no-comment-illustration.svg';
import { useActionDiscussionFeed } from '@/app/referentiels/actions/action-discussion/data/useActionDiscussionFeed';
import { Divider } from '@/ui';
import Image from 'next/image';
import { Fragment } from 'react';
import ActionCommentDiscussion from './action-comments.discussion';
import { TActionDiscussionStatut } from './action-comments.types';

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
          <Image
            src={noCommentIllustration}
            alt="Illustration commentaire vide"
            className="mx-auto"
            width={80}
            height={80}
          />
          <p className="text-sm text-center text-grey-7">
            Aucun commentaire {state === 'ouvert' ? state : 'fermé'} pour
            l’instant
          </p>
        </div>
      ) : (
        discussions.map(
          (discussion, idx) =>
            discussion.commentaires && (
              <Fragment key={discussion.id}>
                <ActionCommentDiscussion discussion={discussion} />
                {idx !== discussions.length - 1 && (
                  <Divider className="-mb-6" />
                )}
              </Fragment>
            )
        )
      )}
    </div>
  );
};

export default ActionCommentFeed;
