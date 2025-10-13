import SpinnerLoader from '@/app/ui/shared/SpinnerLoader';
import { DiscussionMessages } from '@/domain/collectivites';
import { ReferentielId } from '@/domain/referentiels';
import { Select } from '@/ui';
import { useEffect, useMemo, useState } from 'react';
import ActionCommentFeed from './action-comments.feed';
import ActionCommentNew from './action-comments.new';
import { TActionDiscussionStatut } from './action-comments.types';
import { useListDiscussions } from './hooks/use-list-discussions';
import { useUserRoles } from './hooks/use-user-roles';

type Props = {
  parentActionId: string;
  actionId: string;
  referentielId: ReferentielId;
  actionsAndSubActionsIdIdentifiantAndName: {
    actionId: string;
    identifiant: string;
    nom: string;
  }[];
  updateDiscussionCount: (count: number) => void;
};

type TActionDiscussionStatus = TActionDiscussionStatut | 'all';

const statusOptions = [
  { label: 'Tous les commentaires', value: 'all' },
  { label: 'Commentaires ouverts', value: 'ouvert' },
  { label: 'Commentaires fermés', value: 'ferme' },
];

const orderByOptions = [
  { label: 'mesure', value: 'actionId' },
  { label: 'date de publication', value: 'createdAt' },
  { label: 'auteur', value: 'createdBy' },
];

const ActionCommentsPanel = ({
  parentActionId,
  actionId,
  referentielId,
  actionsAndSubActionsIdIdentifiantAndName,
  updateDiscussionCount,
}: Props) => {
  const [selectedAction, setSelectedAction] = useState<string | undefined>(
    actionId
  );
  const [selectedStatus, setSelectedStatus] =
    useState<TActionDiscussionStatus>('ouvert');
  const [selectedOrderBy, setSelectedOrderBy] = useState<string>('actionId');

  const { data: discussions, isPending } = useListDiscussions(referentielId, {
    actionId: parentActionId,
  });

  const { canCreateDiscussion, isAdeme, isSupport } = useUserRoles();

  const actionsOptions = actionsAndSubActionsIdIdentifiantAndName.map(
    (action) => ({
      label: `${action.identifiant} ${action.nom}`,
      value: action.actionId,
    })
  );

  const updateTitlePanel = (discussionMessages: DiscussionMessages[]) => {
    const count = discussionMessages?.reduce(
      (acc, discussion) => acc + discussion.messages.length,
      0
    );
    updateDiscussionCount(count);
  };

  const filteredDiscussions = useMemo(() => {
    return (
      discussions?.filter(
        (discussion) =>
          (selectedAction === parentActionId ||
            discussion.actionId === selectedAction) &&
          (selectedStatus === 'all'
            ? true
            : discussion.status === selectedStatus)
      ) ?? []
    );
  }, [discussions, selectedAction, selectedStatus]);

  updateTitlePanel(filteredDiscussions);
  useEffect(() => {
    updateTitlePanel(filteredDiscussions);
  }, [filteredDiscussions]);

  const sortedDiscussions = useMemo(() => {
    const discussionsToSort = [...filteredDiscussions];

    switch (selectedOrderBy) {
      case 'actionId':
        return discussionsToSort.sort((a, b) =>
          a.actionId.localeCompare(b.actionId)
        );
      case 'createdAt':
        return discussionsToSort.sort((a, b) => {
          const getMostRecentMessageDate = (disc: typeof a) => {
            if (!disc.messages || disc.messages.length === 0) {
              return disc.createdAt;
            }
            return disc.messages.reduce((latest, msg) => {
              return msg.createdAt > latest ? msg.createdAt : latest;
            }, disc.messages[0].createdAt);
          };
          const aLatest = getMostRecentMessageDate(a);
          const bLatest = getMostRecentMessageDate(b);
          return bLatest.localeCompare(aLatest);
        });
      case 'createdBy':
        return discussionsToSort.sort((a, b) => {
          const getMainMessageCreator = (disc: typeof a) => {
            const mainMessage = disc.messages?.reduce((oldest, msg) =>
              msg.createdAt < oldest.createdAt ? msg : oldest
            );
            return (
              mainMessage?.createdByNom ||
              mainMessage?.createdBy ||
              disc.createdBy
            );
          };
          const aCreator = getMainMessageCreator(a);
          const bCreator = getMainMessageCreator(b);
          const creatorCompare = aCreator.localeCompare(bCreator);
          if (creatorCompare === 0) {
            return a.actionId.localeCompare(b.actionId);
          }
          return creatorCompare;
        });
      default:
        return discussionsToSort;
    }
  }, [filteredDiscussions, selectedOrderBy]);

  useEffect(() => {
    setSelectedAction(actionId);
  }, [actionId]);

  if (isPending) {
    return <SpinnerLoader className="m-auto" />;
  }

  return (
    <div
      data-test="ActionDiscussionsPanel"
      className=" flex flex-col justify-between"
    >
      <div className="sticky top-0 z-10 bg-white">
        <div className="mx-4 py-4 flex flex-col gap-4 border-b border-primary-3">
          <div className="flex justify-between items-center gap-4">
            <Select
              placeholder="Trier par"
              options={orderByOptions}
              values={selectedOrderBy}
              onChange={(value) => setSelectedOrderBy(value as string)}
              customItem={(v) => (
                <span className="text-grey-8 text-xs">Trier par {v.label}</span>
              )}
              small
            />
            <Select
              options={statusOptions}
              values={selectedStatus}
              onChange={(value) =>
                setSelectedStatus(value as TActionDiscussionStatut | 'all')
              }
              customItem={(v) => (
                <span className="text-grey-8 text-xs">{v.label}</span>
              )}
              small
            />
          </div>
          <Select
            placeholder="Sélectionner ou rédiger un commentaire sur la mesure"
            options={actionsOptions}
            values={selectedAction ?? undefined}
            onChange={(value) =>
              setSelectedAction(value as string | 'all' | undefined)
            }
            customItem={(v) => (
              <span className="text-grey-8 text-xs">{v.label}</span>
            )}
          />

          {canCreateDiscussion && (
            <ActionCommentNew
              actionId={selectedAction ?? parentActionId}
              disabledInput={!selectedAction}
            />
          )}
        </div>
      </div>

      {/** Feed */}
      <div className="mb-auto">
        <ActionCommentFeed
          state={selectedStatus}
          orderBy={selectedOrderBy}
          discussions={sortedDiscussions}
          isInputDisabled={isSupport || isAdeme}
        />
      </div>
    </div>
  );
};

export default ActionCommentsPanel;
