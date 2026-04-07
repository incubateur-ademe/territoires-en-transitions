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
  selectedActionOrSousAction?: Pick<ActionListItem, 'actionId' | 'actionType'>;
  onActionChange: (value: string | undefined) => void;
  isSousActionsVisible?: boolean;
  placeholder?: string;
  referentielId: ReferentielId;
  collectiviteId: number;
};

export const ActionSelect = ({
  selectedActionOrSousAction,
  onActionChange,
  isSousActionsVisible = false,
  placeholder = 'Toutes les mesures',
  referentielId,
  collectiviteId,
}: ActionSelectProps) => {
  const { data: actions = [] } = useListActions({
    referentielIds: [referentielId],
    actionTypes: isSousActionsVisible
      ? [ActionTypeEnum.ACTION, ActionTypeEnum.SOUS_ACTION]
      : [ActionTypeEnum.ACTION],
    collectiviteId,
  });

  type OptionWithActionType = Option & {
    actionType: ActionType;
  };

  const selectedActionId =
    selectedActionOrSousAction?.actionType === ActionTypeEnum.ACTION
      ? selectedActionOrSousAction.actionId
      : getParentId({ actionId: selectedActionOrSousAction?.actionId ?? '' });

  const actionsOptions: OptionWithActionType[] = useMemo(() => {
    const filteredActions =
      isSousActionsVisible && selectedActionId
        ? actions.filter(
            ({ actionId, actionType }) =>
              (actionType === ActionTypeEnum.ACTION &&
                actionId === selectedActionId) ||
              (actionType === ActionTypeEnum.SOUS_ACTION &&
                getParentId({ actionId }) === selectedActionId)
          )
        : actions;

    const filteredActionOptions = filteredActions.map((action) => ({
      label: `${action.identifiant} ${action.nom}`,
      value: action.actionId,
      actionType: action.actionType,
    }));

    return isSousActionsVisible
      ? filteredActionOptions
      : [
          {
            label: 'Toutes les mesures',
            value: 'all',
            actionType: ActionTypeEnum.ACTION,
          },
          ...filteredActionOptions,
        ];
  }, [actions, isSousActionsVisible, selectedActionId]);

  return (
    <Select
      placeholder={placeholder}
      options={actionsOptions}
      values={selectedActionOrSousAction?.actionId ?? undefined}
      onChange={(value) => onActionChange(value as string | undefined)}
      customItem={(v) => (
        <span
          className={cn('text-grey-8 text-xs text-left', {
            'ml-4':
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
