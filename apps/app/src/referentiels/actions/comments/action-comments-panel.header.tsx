import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { DiscussionOrderBy, DiscussionStatus } from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import {
  ActionSelect,
  OrderBySelect,
  StatusSelect,
} from './action-comments-filters';
import ActionCommentNew from './action-comments.new';

type Props = {
  selectedOrderBy: DiscussionOrderBy;
  onOrderByChange: (value: DiscussionOrderBy) => void;
  selectedStatus: DiscussionStatus;
  onStatusChange: (value: DiscussionStatus) => void;
  selectedAction?: Pick<ActionListItem, 'actionId' | 'actionType'>;
  onActionChange: (value: string | undefined) => void;
  canCreateDiscussion: boolean;
  parentActionId?: string;
  referentielId: ReferentielId;
  collectiviteId: number;
};

const ActionCommentsPanelHeader = ({
  selectedOrderBy,
  onOrderByChange,
  selectedStatus,
  onStatusChange,
  selectedAction,
  onActionChange,
  canCreateDiscussion,
  parentActionId,
  referentielId,
  collectiviteId,
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
          selectedActionOrSousAction={selectedAction}
          onActionChange={onActionChange}
          isSousActionsVisible={true}
          placeholder="Sélectionner ou rédiger un commentaire sur la mesure"
          referentielId={referentielId}
          collectiviteId={collectiviteId}
        />

        {canCreateDiscussion && (selectedAction || parentActionId) && (
          <ActionCommentNew
            actionId={
              parentActionId && !selectedAction
                ? parentActionId
                : selectedAction?.actionId || ''
            }
            disabledInput={!selectedAction}
          />
        )}
      </div>
    </div>
  );
};

export default ActionCommentsPanelHeader;
