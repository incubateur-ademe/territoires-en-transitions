import { Discussion } from '@/domain/collectivites';
import { Badge, Divider } from '@/ui';
import { Fragment } from 'react';
import ActionCommentsEmptyImg from './action-comment.empty-img';
import ActionCommentDiscussion from './action-comments.discussion';
import { TActionDiscussionStatut } from './action-comments.types';

type Props = {
  state: TActionDiscussionStatut;
  discussion: Discussion;
};

const ActionCommentFeed = ({ state, discussion }: Props) => {
  // if (isLoading) {
  //   return <SpinnerLoader className="m-auto" />;
  // }

  return (
    <div
      data-test="ActionDiscussionsFeed"
      className="px-4 pt-4 pb-12 flex gap-4 flex-col"
    >
      {discussion.count === 0 ? (
        <div className="flex flex-col gap-4 mt-32">
          <ActionCommentsEmptyImg className="mx-auto" />
          <p className="text-sm text-center text-grey-7">
            Aucun commentaire {state === 'ouvert' ? state : 'fermé'} pour
            l'instant
          </p>
        </div>
      ) : (
        discussion.data
          .filter(
            (discussion) =>
              discussion.messages && discussion.messages.length > 0
          )
          .map((discussion, idx) => (
            <Fragment key={discussion.id}>
              <Badge
                className="rounded-md border border-primary text-white gap-1 font-bold  px-3 bg-primary w-full"
                state="custom"
                title={`${discussion.actionIdentifiant} - ${discussion.actionNom}`}
                uppercase={false}
              />
              <ActionCommentDiscussion discussion={discussion} />
              {idx !== discussion.messages.length - 1 && (
                <Divider className="-mb-6" />
              )}
            </Fragment>
          ))
      )}
    </div>
  );
};

export default ActionCommentFeed;
