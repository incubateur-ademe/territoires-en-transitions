import { Discussion } from '@/domain/collectivites';
import { ReferentielId } from '@/domain/referentiels';
import { Select } from '@/ui';
import { useState } from 'react';
import ActionCommentFeed from './action-comments.feed';
import ActionCommentNew from './action-comments.new';
import { TActionDiscussionStatut } from './action-comments.types';

type Props = {
  actionId: string;
  referentielId: ReferentielId;
  discussion: Discussion;
};

const ActionCommentsPanel = ({
  actionId,
  referentielId,
  discussion,
}: Props) => {
  const [selectedStatus, setSelectedStatus] =
    useState<TActionDiscussionStatut>('ouvert');
  const [selectedOrderBy, setSelectedOrderBy] = useState<string>('action_id');
  const statusOptions = [
    { label: 'ouvert', value: 'ouvert' },
    { label: 'fermé', value: 'ferme' },
  ];

  const orderByOptions = [
    { label: 'mesure', value: 'action_id' },
    { label: 'date de publication', value: 'created_at' },
    { label: 'auteur', value: 'createdBy' },
  ];

  return (
    <div data-test="ActionDiscussionsPanel" className="grow flex flex-col">
      <div className="sticky top-0 z-10 bg-white">
        <div className="mx-4 py-4 flex flex-col gap-4 border-b border-primary-3">
          <div className="flex justify-between items-center gap-4">
            <Select
              placeholder="Trier par"
              options={orderByOptions}
              values={selectedOrderBy}
              onChange={(value) => setSelectedOrderBy(value as string)}
              customItem={(v) => (
                <span className="text-grey-8 text-xs">Trier par {v.label}</span>
              )}
              small
            />
            <Select
              options={statusOptions}
              values={selectedStatus}
              onChange={(value) =>
                setSelectedStatus(
                  (value as TActionDiscussionStatut) ?? 'ouvert'
                )
              }
              customItem={(v) => (
                <span className="text-grey-8 text-xs">
                  Commentaires {v.label}
                </span>
              )}
              small
            />
          </div>
          {discussion.count === 0 && (
            <ActionCommentNew
              actionId={actionId}
              referentielId={referentielId}
            />
          )}
        </div>
      </div>

      {/** Feed */}
      <ActionCommentFeed state={selectedStatus} discussion={discussion} />
    </div>
  );
};

export default ActionCommentsPanel;
