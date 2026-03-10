import {
  ActionListItem,
  useListActions,
} from '@/app/referentiels/actions/use-list-actions';
import { DiscussionOrderBy, DiscussionStatus } from '@tet/domain/collectivites';
import {
  ActionType,
  ActionTypeEnum,
  getParentId,
  ReferentielId,
} from '@tet/domain/referentiels';
import { Select } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { useMemo } from 'react';
import {
  orderByOptions,
  statusOptions,
} from './action-comments-filters.constants';

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
      customItem={(v) => <span className="text-grey-8 text-xs">{v.label}</span>}
      small
    />
  );
};

type ActionSelectProps = {
  selectedAction?: Pick<ActionListItem, 'actionId' | 'actionType'>;
  onActionChange: (value: string | undefined) => void;
  placeholder?: string;
  indentSubActions?: boolean;
  referentielId: ReferentielId;
  collectiviteId: number;
};

export const ActionSelect = ({
  selectedAction,
  onActionChange,
  placeholder = 'Toutes les mesures',
  indentSubActions = true,
  referentielId,
  collectiviteId,
}: ActionSelectProps) => {
  const { data: actions = [] } = useListActions({
    referentielIds: [referentielId],
    actionTypes: [ActionTypeEnum.ACTION, ActionTypeEnum.SOUS_ACTION],
    collectiviteId,
  });

  type OptionWithActionType = Option & {
    actionType: ActionType;
  };

  const actionsOptions: OptionWithActionType[] = useMemo(() => {
    const filteredActions = !selectedAction
      ? actions.filter((action) => action.actionType === ActionTypeEnum.ACTION)
      : actions.filter(
          ({ actionId, actionType }) =>
            (actionType === ActionTypeEnum.ACTION &&
              actionId === selectedAction.actionId) ||
            (actionType === ActionTypeEnum.SOUS_ACTION &&
              getParentId({ actionId }) === selectedAction.actionId)
        );

    return filteredActions.map((action) => ({
      label: `${action.identifiant} ${action.nom}`,
      value: action.actionId,
      actionType: action.actionType,
    }));
  }, [actions, selectedAction]);

  return (
    <Select
      placeholder={placeholder}
      options={actionsOptions}
      values={selectedAction?.actionId ?? undefined}
      onChange={(value) => onActionChange(value as string | undefined)}
      customItem={(v) => (
        <span
          className={cn('text-grey-8 text-xs text-left', {
            'ml-4':
              indentSubActions &&
              v &&
              (v as OptionWithActionType).actionType ===
                ActionTypeEnum.SOUS_ACTION,
            'pl-4':
              !indentSubActions &&
              v &&
              (v as OptionWithActionType).actionType ===
                ActionTypeEnum.SOUS_ACTION,
          })}
        >
          {v.label}
        </span>
      )}
      small
    />
  );
};
