import { DiscussionMessages } from '@/domain/collectivites';
import { Divider } from '@/ui';
import classNames from 'classnames';
import { Fragment } from 'react';
import ActionCommentsEmptyImg from './action-comment.empty-img';
import ActionCommentDiscussion from './action-comments.discussion';
import { TActionDiscussionStatut } from './action-comments.types';

type Props = {
  state: TActionDiscussionStatut | 'all';
  orderBy: string;
  discussions: DiscussionMessages[];
  isInputDisabled: boolean;
};

const ActionCommentFeed = ({
  state,
  orderBy,
  discussions,
  isInputDisabled,
}: Props) => {
  return (
    <div
      data-test="ActionDiscussionsFeed"
      className="px-4 pt-4 pb-12 flex gap-4 flex-col w-full"
    >
      {discussions.length === 0 ? (
        <div className="flex flex-col gap-4">
          <ActionCommentsEmptyImg className="mx-auto" />
          <p className="text-sm text-center text-grey-7">
            Aucun commentaire {state === 'ouvert' ? state : 'fermé'} pour
            l&apos;instant
          </p>
        </div>
      ) : (
        discussions.map((discussion, idx) => (
          <Fragment key={discussion.id}>
            {orderBy === 'actionId' &&
              discussion.actionId !== discussions[idx - 1]?.actionId && (
                <div
                  className={classNames(
                    'rounded-md border border-primary text-white text-sm  gap-1 font-bold  px-3 bg-primary sticky z-10',
                    {
                      'top-[139px]': isInputDisabled,
                      'top-[190px]': !isInputDisabled,
                    }
                  )}
                >
                  <span>{`${discussion.actionIdentifiant} - ${discussion.actionNom}`}</span>
                </div>
              )}
            <ActionCommentDiscussion
              discussion={discussion}
              title={
                orderBy !== 'actionId'
                  ? `${discussion.actionIdentifiant} - ${discussion.actionNom}`
                  : undefined
              }
            />
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
