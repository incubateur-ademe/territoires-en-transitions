import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { useCollectiviteId } from '@tet/api/collectivites';
import { DiscussionOrderBy, DiscussionStatus } from '@tet/domain/collectivites';
import {
  ActionSelect,
  OrderBySelect,
  StatusSelect,
} from './action-comments-filters';

type Props = {
  selectedOrderBy: DiscussionOrderBy;
  onOrderByChange: (value: DiscussionOrderBy) => void;
  selectedStatus: DiscussionStatus;
  onStatusChange: (value: DiscussionStatus) => void;
  selectedAction?: Pick<ActionListItem, 'actionId' | 'actionType'>;
  onActionChange: (value: string | undefined) => void;
  commentsCount?: number;
};

const ActionCommentsTabHeader = ({
  selectedOrderBy,
  onOrderByChange,
  selectedStatus,
  onStatusChange,
  selectedAction,
  onActionChange,
  commentsCount,
}: Props) => {
  const referentielId = useReferentielId();
  const collectiviteId = useCollectiviteId();

  // const actionsWithAllOption = useMemo(() => {
  //   return [
  //     {
  //       label: 'Toutes les mesures',
  //       value: 'all',
  //     },
  //     ...options,
  //   ];
  // }, [options]);

  return (
    <div className="bg-white">
      <div className="mx-4 py-4 flex flex-col gap-4 border-b border-primary-3">
        <div className="flex items-center gap-24">
          <div className="flex-none justify-self-start">
            <OrderBySelect
              selectedOrderBy={selectedOrderBy}
              onOrderByChange={onOrderByChange}
            />
          </div>
          <div className="flex items-center gap-2 w-full justify-end">
            <span className="text-grey-8 text-xs">
              {commentsCount ?? 0}{' '}
              {`commentaire${(commentsCount ?? 0) > 1 ? 's' : ''}`}
            </span>
            <div className="">
              <StatusSelect
                selectedStatus={selectedStatus}
                onStatusChange={onStatusChange}
              />
            </div>
            <div className="flex-1 ">
              <ActionSelect
                selectedAction={selectedAction}
                onActionChange={onActionChange}
                referentielId={referentielId}
                collectiviteId={collectiviteId}
                placeholder="Toutes les mesures"
                indentSubActions={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionCommentsTabHeader;
