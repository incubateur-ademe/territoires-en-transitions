import { isSousMesure } from '@/app/referentiels/actions/comments/helpers/action-comments-helper';
import {
  DiscussionOrderBy,
  discussionOrderByValues,
  DiscussionStatus,
  DiscussionStatutEnum,
} from '@/domain/collectivites';
import { ReferentielId } from '@/domain/referentiels';
import { Select } from '@/ui';
import { cn } from '@/ui/utils/cn';
import ActionCommentNew from './action-comments.new';

type Option = {
  label: string;
  value: string;
};

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

const statusOptions = [
  { label: 'Tous les commentaires', value: DiscussionStatutEnum.ALL },
  { label: 'Commentaires ouverts', value: DiscussionStatutEnum.OUVERT },
  { label: 'Commentaires fermés', value: DiscussionStatutEnum.FERME },
];

const orderByOptions = [
  { label: 'mesure', value: discussionOrderByValues.ACTION_ID },
  { label: 'date de publication', value: discussionOrderByValues.CREATED_AT },
  { label: 'auteur', value: discussionOrderByValues.CREATED_BY },
];

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
          <Select
            placeholder="Trier par"
            options={orderByOptions}
            values={selectedOrderBy}
            onChange={(value) => onOrderByChange(value as DiscussionOrderBy)}
            customItem={(v) => (
              <span className="text-grey-8 text-xs">Trier par {v.label}</span>
            )}
            small
          />
          <Select
            options={statusOptions}
            values={selectedStatus}
            onChange={(value) => onStatusChange(value as DiscussionStatus)}
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
          onChange={(value) => onActionChange(value as string | undefined)}
          customItem={(option) => (
            <span
              className={cn('text-grey-8 text-xs text-left', {
                'pl-4': isSousMesure(option.value as string, referentielId),
              })}
            >
              {option.label}
            </span>
          )}
        />

        {canCreateDiscussion && (selectedAction || parentActionId) && (
          <ActionCommentNew
            actionId={selectedAction ?? parentActionId ?? ''}
            disabledInput={!selectedAction}
          />
        )}
      </div>
    </div>
  );
};

export default ActionCommentsPanelHeader;
