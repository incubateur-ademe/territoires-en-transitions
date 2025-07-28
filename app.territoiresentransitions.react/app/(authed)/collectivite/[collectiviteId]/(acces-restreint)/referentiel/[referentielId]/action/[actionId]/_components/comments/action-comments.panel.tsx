import { Icon, Select } from '@/ui';
import { useState } from 'react';
import ActionCommentFeed from './action-comments.feed';
import ActionCommentNew from './action-comments.new';
import { TActionDiscussionStatut } from './action-comments.types';

type Props = {
  setIsOpen: (state: boolean) => void;
  actionId: string;
};

const ActionCommentsPanel = ({ setIsOpen, actionId }: Props) => {
  const [selectedState, setSelectedState] =
    useState<TActionDiscussionStatut>('ouvert');

  const stateOptions = [
    { label: 'Ouvert', value: 'ouvert' },
    { label: 'Fermé', value: 'ferme' },
  ];

  return (
    <div
      data-test="ActionDiscussionsPanel"
      className="relative w-full border-l border-primary-3 bg-white shadow"
    >
      <div className="sticky inset-0 flex flex-col h-screen max-h-screen">
        {/** Header */}
        <div className="sticky top-0 z-10 bg-white">
          {/* Icônes fermer / titre  */}
          <div className="flex items-center border-b border-primary-3">
            <button className="p-2 w-10 h-10" onClick={() => setIsOpen(false)}>
              <Icon
                icon="arrow-right-double-line"
                size="xs"
                className="text-primary-8 hover:text-primary-10 transition-colors cursor-pointer"
                title="Fermer"
              />
            </button>
            <div className="mr-4 bg-primary-3 h-8 w-[0.5px]" />
            <h6 className="mb-0 text-sm uppercase">Commentaires</h6>
          </div>
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
    </div>
  );
};

export default ActionCommentsPanel;
