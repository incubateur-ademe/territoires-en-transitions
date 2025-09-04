import { Select } from '@/ui';
import { useState } from 'react';
import ActionCommentFeed from './action-comments.feed';
import ActionCommentNew from './action-comments.new';
import { TActionDiscussionStatut } from './action-comments.types';

type Props = {
  actionId: string;
};

const ActionCommentsPanel = ({ actionId }: Props) => {
  const [selectedState, setSelectedState] =
    useState<TActionDiscussionStatut>('ouvert');

  const stateOptions = [
    { label: 'Ouvert', value: 'ouvert' },
    { label: 'Fermé', value: 'ferme' },
  ];

  return (
    <div data-test="ActionDiscussionsPanel">
      {/** Header */}
      <div className="sticky top-0 z-10 bg-white">
        {/* Nouveau commentaire  */}
        <div className="mx-4 py-4 flex flex-col gap-4 border-b border-primary-3">
          <Select
            options={stateOptions}
            values={selectedState}
            onChange={(value) =>
              setSelectedState((value as TActionDiscussionStatut) ?? 'ouvert')
            }
            customItem={(v) => (
              <span className="text-grey-8 font-normal">{v.label}</span>
            )}
            small
          />

          <ActionCommentNew actionId={actionId} />
        </div>
      </div>

      {/** Feed */}
      <ActionCommentFeed actionId={actionId} state={selectedState} />
    </div>
  );
};

export default ActionCommentsPanel;
