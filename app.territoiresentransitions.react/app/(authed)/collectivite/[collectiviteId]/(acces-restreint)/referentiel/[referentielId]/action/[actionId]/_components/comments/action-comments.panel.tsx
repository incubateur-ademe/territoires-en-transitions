import { Divider, Select, SideMenu, sideMenuContentZindex } from '@/ui';
import classNames from 'classnames';
import { useState } from 'react';
import ActionCommentFeed from './action-comments.feed';
import ActionCommentNew from './action-comments.new';
import { TActionDiscussionStatut } from './action-comments.types';

type Props = {
  isOpen: boolean;
  setIsOpen: (state: boolean) => void;
  actionId: string;
};

const ActionCommentsPanel = ({ isOpen, setIsOpen, actionId }: Props) => {
  const [selectedState, setSelectedState] =
    useState<TActionDiscussionStatut>('ouvert');

  const stateOptions = [
    { label: 'Ouvert', value: 'ouvert' },
    { label: 'Fermé', value: 'ferme' },
  ];

  return (
    <SideMenu
      dataTest="ActionDiscussionsPanel"
      title="Commentaires"
      isOpen={isOpen}
      setIsOpen={setIsOpen}
    >
      <div className="relative flex flex-col gap-6">
        <div
          className={classNames(
            'sticky pt-4 px-4 top-0 flex flex-col gap-4 bg-white',
            sideMenuContentZindex
          )}
        >
          <Select
            options={stateOptions}
            values={selectedState}
            onChange={(value) =>
              setSelectedState((value as TActionDiscussionStatut) ?? 'ouvert')
            }
            customItem={(v) => (
              <span className="text-grey-8 font-normal">{v.label}</span>
            )}
            dropdownZindex={802}
            small
          />

          <ActionCommentNew actionId={actionId} />

          <Divider className="-mb-6 mt-2" />
        </div>

        <ActionCommentFeed actionId={actionId} state={selectedState} />
      </div>
    </SideMenu>
  );
};

export default ActionCommentsPanel;
