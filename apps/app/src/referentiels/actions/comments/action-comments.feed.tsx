import { buildActionLink } from '@/app/referentiels/actions/comments/helpers/action-comments-helper';
import { useGetAction } from '@/app/referentiels/actions/use-get-action';
import { useCollectiviteId } from '@tet/api/collectivites';
import {
  DiscussionWithMessages,
  discussionOrderByEnum,
} from '@tet/domain/collectivites';
import { Divider, VisibleWhen } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { pluralize } from 'app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/pluralize';
import Link from 'next/link';
import ActionCommentsEmptyImg from './action-comment.empty-img';
import ActionCommentDiscussion from './action-comments.discussion';
import { ActionDiscussionStatut } from './action-comments.types';

type Props = {
  state: ActionDiscussionStatut | 'all';
  orderBy: string;
  discussions: DiscussionWithMessages[];
  isInputDisabled: boolean;
  isDisplayedAsPanel?: boolean;
};

const ActionCommentFeed = ({
  state,
  orderBy,
  discussions,
  isInputDisabled,
  isDisplayedAsPanel = true,
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
            {`Aucun commentaire ${
              state === 'all' ? '' : state === 'ouvert' ? 'ouvert' : 'fermé'
            } pour l'instant`}
          </p>
        </div>
      ) : (
        discussions.map((discussion, idx) => (
          <ActionComment
            key={idx}
            discussion={discussion}
            previousDiscussion={discussions[idx - 1]}
            orderBy={orderBy}
            isDisplayedAsPanel={isDisplayedAsPanel}
            isInputDisabled={isInputDisabled}
          />
        ))
      )}
    </div>
  );
};

function ActionComment({
  discussion,
  previousDiscussion,
  orderBy,
  isDisplayedAsPanel,
  isInputDisabled,
}: {
  discussion: DiscussionWithMessages;
  previousDiscussion?: DiscussionWithMessages;
  orderBy: string;
  isDisplayedAsPanel: boolean;
  isInputDisabled: boolean;
}) {
  const collectiviteId = useCollectiviteId();
  const action = useGetAction({ actionId: discussion.actionId });

  const numberOfMessages = discussion.messages.length;

  return (
    <>
      <VisibleWhen
        condition={
          orderBy === discussionOrderByEnum.CREATED_BY &&
          discussion.createdBy !== previousDiscussion?.createdBy &&
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
          discussion.actionId !== previousDiscussion?.actionId
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
            action && (
              <>
                <Link
                  href={buildActionLink(action, collectiviteId)}
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
              </>
            )
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
        orderBy !== discussionOrderByEnum.CREATED_BY && <Divider />}
    </>
  );
}

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
          'sticky z-1': isDisplayedAsPanel,
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
        <span>{pluralize(numberOfMessages, 'commentaire')}</span>
      </VisibleWhen>
    </div>
  );
};

export default ActionCommentFeed;
