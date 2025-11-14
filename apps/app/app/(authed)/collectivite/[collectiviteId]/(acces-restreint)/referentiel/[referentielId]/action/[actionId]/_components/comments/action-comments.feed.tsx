import { useCollectiviteId } from '@/api/collectivites';
import { makeReferentielActionUrl } from '@/app/app/paths';
import { DiscussionMessages } from '@/domain/collectivites';
import { ReferentielId } from '@/domain/referentiels';
import { Divider } from '@/ui';
import { cn } from '@/ui/utils/cn';
import Link from 'next/link';
import { Fragment } from 'react';
import ActionCommentsEmptyImg from './action-comment.empty-img';
import ActionCommentDiscussion from './action-comments.discussion';
import { TActionDiscussionStatut } from './action-comments.types';
import { isSousMesure } from './helpers/action-comments-helper';

type Props = {
  state: TActionDiscussionStatut | 'all';
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

  const buildActionLink = (discussion: DiscussionMessages) => {
    const actionId = isSousMesure(discussion.actionId, referentielId)
      ? discussion.actionId.split('.').slice(0, -1).join('.')
      : discussion.actionId;
    return `${makeReferentielActionUrl({
      collectiviteId,
      referentielId,
      actionId: actionId,
    })}#${discussion.actionId}`;
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
            {state !== 'all' ? (state === 'ouvert' ? state : 'fermé') : ''} pour
            l&apos;instant
          </p>
        </div>
      ) : (
        discussions.map((discussion, idx) => (
          <Fragment key={discussion.id}>
            {orderBy === 'actionId' &&
              discussion.actionId !== discussions[idx - 1]?.actionId && (
                <Link
                  href={buildActionLink(discussion)}
                  target="_blank"
                  className="no-underline after:hidden"
                >
                  <div
                    className={cn(
                      'flex items-center justify-between rounded-md border border-primary text-white text-sm  gap-1 font-bold  px-3 bg-primary',
                      {
                        'top-[139px]': !isDisplayedAsPanel || isInputDisabled,
                        'top-[190px]': isDisplayedAsPanel && !isInputDisabled,
                        'sticky z-10': isDisplayedAsPanel,
                      }
                    )}
                  >
                    <span>{`${discussion.actionIdentifiant} - ${discussion.actionNom}`}</span>{' '}
                    {!isDisplayedAsPanel && (
                      <span>
                        {` ${countDiscussionMessages(
                          discussion.actionIdentifiant
                        )} commentaire${
                          countDiscussionMessages(
                            discussion.actionIdentifiant
                          ) > 1
                            ? 's'
                            : ''
                        }`}{' '}
                      </span>
                    )}
                  </div>
                </Link>
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
