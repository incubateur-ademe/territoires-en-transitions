import { isSousMesure } from '@/app/referentiels/actions/comments/helpers/action-comments-helper';
import {
  DiscussionOrderBy,
  DiscussionStatus,
} from '@/domain/collectivites';
import { ReferentielId } from '@/domain/referentiels';
import { Select } from '@/ui';
import { cn } from '@/ui/utils/cn';
import { orderByOptions, statusOptions } from './action-comments-filters.constants';

export type Option = {
  label: string;
  value: string;
};

type OrderBySelectProps = {
  selectedOrderBy: DiscussionOrderBy;
  onOrderByChange: (value: DiscussionOrderBy) => void;
};

export const OrderBySelect = ({
  selectedOrderBy,
  onOrderByChange,
}: OrderBySelectProps) => {
  return (
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
  );
};

type StatusSelectProps = {
  selectedStatus: DiscussionStatus;
  onStatusChange: (value: DiscussionStatus) => void;
};

export const StatusSelect = ({
  selectedStatus,
  onStatusChange,
}: StatusSelectProps) => {
  return (
    <Select
      options={statusOptions}
      values={selectedStatus}
      onChange={(value) => onStatusChange(value as DiscussionStatus)}
      customItem={(v) => (
        <span className="text-grey-8 text-xs">{v.label}</span>
      )}
      small
    />
  );
};

type ActionSelectProps = {
  selectedAction?: string;
  onActionChange: (value: string | undefined) => void;
  actionsOptions: Option[];
  referentielId: ReferentielId;
  placeholder?: string;
  indentSubActions?: boolean;
};

export const ActionSelect = ({
  selectedAction,
  onActionChange,
  actionsOptions,
  referentielId,
  placeholder = 'Toutes les mesures',
  indentSubActions = true,
}: ActionSelectProps) => {
  return (
    <Select
      placeholder={placeholder}
      options={actionsOptions}
      values={selectedAction ?? undefined}
      onChange={(value) => onActionChange(value as string | undefined)}
      customItem={(v) => (
        <span
          className={cn('text-grey-8 text-xs text-left', {
            'ml-4': indentSubActions && isSousMesure(v.value as string, referentielId),
            'pl-4': !indentSubActions && isSousMesure(v.value as string, referentielId),
          })}
        >
          {v.label}
        </span>
      )}
      small
    />
  );
};

