import React from 'react';
import '../CrossExpandPanel.css';
import {useEpciId, useStorable} from 'core-logic/hooks';
import {ActionMetaStorable} from 'storables/ActionMetaStorable';
import {actionMetaStore} from 'core-logic/api/hybridStores';
import {ActionMetaTypedInterface} from 'types/ActionMetaTypedInterface';

export const ActionCommentaire = (props: {actionId: string}) => {
  const epciId = useEpciId();
  const [value, setValue] = React.useState('');
  const meta = useStorable<ActionMetaStorable>(
    ActionMetaStorable.buildId(epciId!, props.actionId),
    actionMetaStore
  );
  const data = meta as ActionMetaTypedInterface | null;

  // here we link the co-dependent states
  if (data && data.meta.commentaire && !value) setValue(data.meta.commentaire);

  function handleSave(
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const data: ActionMetaTypedInterface = {
      action_id: props.actionId,
      epci_id: epciId!,
      meta: {commentaire: event.currentTarget.value},
    };
    actionMetaStore.store(new ActionMetaStorable(data)).then(storable => {
      const data = storable as ActionMetaTypedInterface;
      setValue(data.meta.commentaire);
    });
  }

  return (
    <div className={' border-gray-300'}>
      <div className="CrossExpandPanel">
        <details>
          <summary className="title">Commentaire</summary>

          <textarea
            defaultValue={value}
            onBlur={handleSave}
            className="fr-input mt-2 w-full bg-white p-3 mr-5"
          />
        </details>
      </div>
    </div>
  );
};
