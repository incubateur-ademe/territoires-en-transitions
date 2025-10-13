import { DiscussionOrderBy, DiscussionStatus } from '@/domain/collectivites';
import { ReferentielId } from '@/domain/referentiels';
import {
  ActionSelect,
  OrderBySelect,
  StatusSelect,
  type Option,
} from './action-comments-filters';
import ActionCommentNew from './action-comments.new';

type Props = {
  selectedOrderBy: DiscussionOrderBy;
  onOrderByChange: (value: DiscussionOrderBy) => void;
  selectedStatus: DiscussionStatus;
  onStatusChange: (value: DiscussionStatus) => void;
  selectedAction?: string;
  onActionChange: (value: string | undefined) => void;
  actionsOptions: Option[];
  canCreateDiscussion: boolean;
  parentActionId?: string;
  referentielId: ReferentielId;
};

const ActionCommentsPanelHeader = ({
  selectedOrderBy,
  onOrderByChange,
  selectedStatus,
  onStatusChange,
  selectedAction,
  onActionChange,
  actionsOptions,
  canCreateDiscussion,
  parentActionId,
  referentielId,
}: Props) => {
  return (
    <div className="bg-white sticky top-0 z-10">
      <div className="mx-4 py-4 flex flex-col gap-4 border-b border-primary-3">
        <div className="flex justify-between items-center gap-4">
          <OrderBySelect
            selectedOrderBy={selectedOrderBy}
            onOrderByChange={onOrderByChange}
          />
          <StatusSelect
            selectedStatus={selectedStatus}
            onStatusChange={onStatusChange}
          />
        </div>
        <ActionSelect
          selectedAction={selectedAction}
          onActionChange={onActionChange}
          actionsOptions={actionsOptions}
          referentielId={referentielId}
          placeholder="Sélectionner ou rédiger un commentaire sur la mesure"
          indentSubActions={false}
        />

        {canCreateDiscussion && (selectedAction || parentActionId) && (
          <ActionCommentNew
            actionId={
              parentActionId && (selectedAction === 'all' || !selectedAction)
                ? parentActionId
                : selectedAction || ''
            }
            disabledInput={!selectedAction}
          />
        )}
      </div>
    </div>
  );
};

export default ActionCommentsPanelHeader;
