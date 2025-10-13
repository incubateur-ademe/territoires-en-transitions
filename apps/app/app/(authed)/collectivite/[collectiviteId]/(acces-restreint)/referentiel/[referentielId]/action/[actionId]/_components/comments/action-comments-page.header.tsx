import { DiscussionOrderBy, DiscussionStatus } from '@/domain/collectivites';
import { ReferentielId } from '@/domain/referentiels';
import {
  ActionSelect,
  OrderBySelect,
  StatusSelect,
  type Option,
} from './action-comments-filters';

type Props = {
  selectedOrderBy: DiscussionOrderBy;
  onOrderByChange: (value: DiscussionOrderBy) => void;
  selectedStatus: DiscussionStatus;
  onStatusChange: (value: DiscussionStatus) => void;
  selectedAction?: string;
  onActionChange: (value: string | undefined) => void;
  actionsOptions: Option[];
  commentsCount?: number;
  referentielId: ReferentielId;
};

const ActionCommentsPageHeader = ({
  selectedOrderBy,
  onOrderByChange,
  selectedStatus,
  onStatusChange,
  selectedAction,
  onActionChange,
  actionsOptions,
  commentsCount,
  referentielId,
}: Props) => {
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
                actionsOptions={actionsOptions}
                referentielId={referentielId}
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

export default ActionCommentsPageHeader;
