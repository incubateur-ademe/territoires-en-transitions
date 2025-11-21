import { useCollectiviteId } from '@/api/collectivites';
import { buildActionLink } from '@/app/referentiels/actions/comments/helpers/action-comments-helper';
import {
  DiscussionMessages,
  discussionOrderByValues,
} from '@/domain/collectivites';
import { ReferentielId } from '@/domain/referentiels';
import { Divider, VisibleWhen } from '@/ui';
import { cn } from '@/ui/utils/cn';
import Link from 'next/link';
import { Fragment } from 'react';
import ActionCommentsEmptyImg from './action-comment.empty-img';
import ActionCommentDiscussion from './action-comments.discussion';
import { ActionDiscussionStatut } from './action-comments.types';

type Props = {
  state: ActionDiscussionStatut | 'all';
  orderBy: string;
  discussions: DiscussionMessages[];
  isInputDisabled: boolean;
  isDisplayedAsPanel?: boolean;
  referentielId: ReferentielId;
};

const ActionCommentFeed = ({
  state,
  orderBy,
  discussions,
  isInputDisabled,
  isDisplayedAsPanel = true,
  referentielId,
}: Props) => {
  const collectiviteId = useCollectiviteId();
  const countDiscussionMessages = (actionIdentifiant: string) => {
    return discussions
      .filter(
        (discussion) => discussion.actionIdentifiant === actionIdentifiant
      )
      .reduce((acc, discussion) => acc + discussion.messages.length, 0);
  };

  const ActionHeader = ({
    discussion,
    numberOfMessages,
  }: {
    discussion: DiscussionMessages;
    numberOfMessages: number;
  }) => {
    return (
      <div
        className={cn(
          'flex items-center justify-between rounded-md border border-primary text-white text-sm  gap-1 font-bold  px-3 bg-primary',
          {
            'top-[139px]': !isDisplayedAsPanel || isInputDisabled,
            'top-[180px]': isDisplayedAsPanel && !isInputDisabled,
            'sticky z-10': isDisplayedAsPanel,
          }
        )}
      >
        <span>{`${discussion.actionIdentifiant} - ${discussion.actionNom}`}</span>{' '}
        <VisibleWhen condition={!isDisplayedAsPanel}>
          <span>
            {` ${numberOfMessages} commentaire${
              numberOfMessages > 1 ? 's' : ''
            }`}{' '}
          </span>
        </VisibleWhen>
      </div>
    );
  };

  return (
    <div
      data-test="ActionDiscussionsFeed"
      className="px-4 pt-4 pb-12 flex gap-4 flex-col w-full"
    >
      {discussions.length === 0 ? (
        <div className="flex flex-col gap-4">
          <ActionCommentsEmptyImg className="mx-auto" />
          <p className="text-sm text-center text-grey-7">
            Aucun commentaire{' '}
            {{ all: '', ouvert: 'ouvert', ferme: 'fermé' }[state]} pour
            l&apos;instant
          </p>
        </div>
      ) : (
        discussions.map((discussion, idx) => {
          const numberOfMessages = countDiscussionMessages(
            discussion.actionIdentifiant
          );
          return (
            <Fragment key={discussion.id}>
              <VisibleWhen
                condition={
                  orderBy === discussionOrderByValues.ACTION_ID &&
                  discussion.actionId !== discussions[idx - 1]?.actionId
                }
              >
                <>
                  {isDisplayedAsPanel ? (
                    <ActionHeader
                      discussion={discussion}
                      numberOfMessages={numberOfMessages}
                    />
                  ) : (
                    <Link
                      href={buildActionLink(
                        discussion.actionId,
                        referentielId,
                        collectiviteId
                      )}
                      target="_blank"
                      className="after:hidden bg-none"
                    >
                      <ActionHeader
                        discussion={discussion}
                        numberOfMessages={numberOfMessages}
                      />
                    </Link>
                  )}
                </>
              </VisibleWhen>
              <ActionCommentDiscussion
                discussion={discussion}
                title={
                  orderBy !== discussionOrderByValues.ACTION_ID
                    ? `${discussion.actionIdentifiant} - ${discussion.actionNom}`
                    : undefined
                }
              />
              {orderBy !== discussionOrderByValues.ACTION_ID && (
                <Divider className="-mb-6" />
              )}
            </Fragment>
          );
        })
      )}
    </div>
  );
};

export default ActionCommentFeed;
