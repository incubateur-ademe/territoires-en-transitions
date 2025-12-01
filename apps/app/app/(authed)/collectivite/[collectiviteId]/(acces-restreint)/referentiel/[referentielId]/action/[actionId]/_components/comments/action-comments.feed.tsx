import { buildActionLink } from '@/app/referentiels/actions/comments/helpers/action-comments-helper';
import { useCollectiviteId } from '@tet/api/collectivites';
import {
  DiscussionWithMessages,
  discussionOrderByEnum,
} from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { Divider, VisibleWhen } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import Link from 'next/link';
import { Fragment, useMemo } from 'react';
import ActionCommentsEmptyImg from './action-comment.empty-img';
import ActionCommentDiscussion from './action-comments.discussion';
import { ActionDiscussionStatut } from './action-comments.types';

type Props = {
  state: ActionDiscussionStatut | 'all';
  orderBy: string;
  discussions: DiscussionWithMessages[];
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

  const discussionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    discussions.forEach((d) => {
      if (!counts[d.actionIdentifiant]) counts[d.actionIdentifiant] = 0;
      counts[d.actionIdentifiant] += d.messages.length;
    });
    return counts;
  }, [discussions]);

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
          const numberOfMessages =
            discussionCounts[discussion.actionIdentifiant];
          return (
            <Fragment key={discussion.id}>
              <VisibleWhen
                condition={
                  orderBy === discussionOrderByEnum.CREATED_BY &&
                  discussion.createdBy !== discussions[idx - 1]?.createdBy &&
                  !isDisplayedAsPanel
                }
              >
                <ActionHeader
                  discussion={discussion}
                  numberOfMessages={numberOfMessages}
                  orderBy={orderBy}
                  canDisplayNumberOfMessages={false}
                  isDisplayedAsPanel={isDisplayedAsPanel}
                  isInputDisabled={isInputDisabled}
                />
              </VisibleWhen>

              <VisibleWhen
                condition={
                  orderBy === discussionOrderByEnum.ACTION_ID &&
                  discussion.actionId !== discussions[idx - 1]?.actionId
                }
              >
                <>
                  {isDisplayedAsPanel ? (
                    <ActionHeader
                      discussion={discussion}
                      numberOfMessages={numberOfMessages}
                      orderBy={orderBy}
                      canDisplayNumberOfMessages={false}
                      isDisplayedAsPanel={isDisplayedAsPanel}
                      isInputDisabled={isInputDisabled}
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
                        orderBy={orderBy}
                        canDisplayNumberOfMessages={true}
                        isDisplayedAsPanel={isDisplayedAsPanel}
                        isInputDisabled={isInputDisabled}
                      />
                    </Link>
                  )}
                </>
              </VisibleWhen>
              <ActionCommentDiscussion
                discussion={discussion}
                title={
                  orderBy !== discussionOrderByEnum.ACTION_ID
                    ? `${discussion.actionIdentifiant} - ${discussion.actionNom}`
                    : undefined
                }
                isDisplayedAsPanel={isDisplayedAsPanel}
              />
              {orderBy !== discussionOrderByEnum.ACTION_ID &&
                orderBy !== discussionOrderByEnum.CREATED_BY && (
                  <Divider className="-mb-6" />
                )}
            </Fragment>
          );
        })
      )}
    </div>
  );
};

const ActionHeader = ({
  discussion,
  numberOfMessages,
  orderBy,
  canDisplayNumberOfMessages,
  isDisplayedAsPanel,
  isInputDisabled,
}: {
  discussion: DiscussionWithMessages;
  numberOfMessages: number;
  orderBy: string;
  canDisplayNumberOfMessages: boolean;
  isDisplayedAsPanel: boolean;
  isInputDisabled: boolean;
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
      {orderBy === discussionOrderByEnum.CREATED_BY ? (
        <span>
          {discussion.messages[0].createdByPrenom}{' '}
          {discussion.messages[0].createdByNom}
        </span>
      ) : (
        <span>{`${discussion.actionIdentifiant} - ${discussion.actionNom}`}</span>
      )}
      <VisibleWhen condition={canDisplayNumberOfMessages}>
        <span>
          {` ${numberOfMessages} commentaire${numberOfMessages > 1 ? 's' : ''}`}{' '}
        </span>
      </VisibleWhen>
    </div>
  );
};

export default ActionCommentFeed;
