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
  commentsCount?: number;
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
                onChange={(value) => onStatusChange(value as DiscussionStatus)}
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
    </div>
  );
};

export default ActionCommentsPageHeader;
