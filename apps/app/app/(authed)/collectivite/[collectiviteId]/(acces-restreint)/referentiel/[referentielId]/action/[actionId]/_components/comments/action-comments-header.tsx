import { ReferentielId } from '@/domain/referentiels';
import { Select } from '@/ui';
import { cn } from '@/ui/utils/cn';
import ActionCommentNew from './action-comments.new';
import { TActionDiscussionStatut } from './action-comments.types';
import { isSousMesure } from './helpers/action-comments-helper';

export type TActionDiscussionStatus = TActionDiscussionStatut | 'all';

type Option = {
  label: string;
  value: string;
};

type Props = {
  selectedOrderBy: string;
  onOrderByChange: (value: string) => void;
  selectedStatus: TActionDiscussionStatus;
  onStatusChange: (value: TActionDiscussionStatus) => void;
  selectedAction?: string;
  onActionChange: (value: string | undefined) => void;
  actionsOptions: Option[];
  canCreateDiscussion: boolean;
  parentActionId?: string;
  isdisplayedAsSidePanel: boolean;
  commentsCount?: number;
  referentielId: ReferentielId;
};

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

const ActionCommentsHeader = ({
  selectedOrderBy,
  onOrderByChange,
  selectedStatus,
  onStatusChange,
  selectedAction,
  onActionChange,
  actionsOptions,
  canCreateDiscussion,
  parentActionId,
  isdisplayedAsSidePanel,
  commentsCount,
  referentielId,
}: Props) => {
  return (
    <div
      className={cn('bg-white', {
        'sticky top-0 z-10  ': isdisplayedAsSidePanel,
      })}
    >
      {isdisplayedAsSidePanel ? (
        <div className="mx-4 py-4 flex flex-col gap-4 border-b border-primary-3">
          <div className="flex justify-between items-center gap-4">
            <Select
              placeholder="Trier par"
              options={orderByOptions}
              values={selectedOrderBy}
              onChange={(value) => onOrderByChange(value as string)}
              customItem={(v) => (
                <span className="text-grey-8 text-xs">Trier par {v.label}</span>
              )}
              small
            />
            <Select
              options={statusOptions}
              values={selectedStatus}
              onChange={(value) =>
                onStatusChange(value as TActionDiscussionStatus)
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
      ) : (
        <div className="mx-4 py-4 flex flex-col gap-4 border-b border-primary-3">
          <div className="flex items-center gap-24">
            <div className="flex-none justify-self-start">
              <Select
                placeholder="Trier par"
                options={orderByOptions}
                values={selectedOrderBy}
                onChange={(value) => onOrderByChange(value as string)}
                customItem={(v) => (
                  <span className="text-grey-8 text-xs">
                    Trier par {v.label}
                  </span>
                )}
                small
              />
            </div>
            <div className="flex items-center gap-2 w-full justify-end">
              <span className="text-grey-8 text-xs">
                {commentsCount ?? 0}{' '}
                {`commentaire${(commentsCount ?? 0) > 1 ? 's' : ''}`}
              </span>
              <div className="">
                <Select
                  options={statusOptions}
                  values={selectedStatus}
                  onChange={(value) =>
                    onStatusChange(value as TActionDiscussionStatus)
                  }
                  customItem={(v) => (
                    <span className="text-grey-8 text-xs">{v.label}</span>
                  )}
                  small
                />
              </div>
              <div className="flex-1 ">
                <Select
                  placeholder="Toutes les mesures"
                  options={actionsOptions}
                  values={selectedAction ?? undefined}
                  onChange={(value) =>
                    onActionChange(value as string | undefined)
                  }
                  customItem={(v) => (
                    <span
                      className={cn('text-grey-8 text-xs text-left', {
                        'ml-4': isSousMesure(v.value as string, referentielId),
                      })}
                    >
                      {v.label}
                    </span>
                  )}
                  small
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionCommentsHeader;
