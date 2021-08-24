import React, {FocusEventHandler} from 'react';
import '../CrossExpandPanel.css';
import {useEpciId, useStorable} from 'core-logic/hooks';
import {ActionMetaStorable} from 'storables/ActionMetaStorable';
import {actionMetaStore} from 'core-logic/api/hybridStores';
import {ActionMetaTypedInterface} from 'types/ActionMetaTypedInterface';

export const ActionCommentaire = (props: {actionId: string}) => {
  const epciId = useEpciId();
  const meta = useStorable<ActionMetaStorable>(
    ActionMetaStorable.buildId(epciId!, props.actionId),
    actionMetaStore
  );

  return (
    <div className={'border-t border-b border-gray-300'}>
      <div className="CrossExpandPanel">
        <details>
          <summary>
            {ActionMetaStorable.buildId(epciId!, props.actionId)}
          </summary>

          <ActionCommentaireInput meta={meta} actionId={props.actionId} />
        </details>
      </div>
    </div>
  );
};

const ActionCommentaireInput = (props: {
  actionId: string;
  meta: ActionMetaStorable | null;
}) => {
  const data = props.meta as ActionMetaTypedInterface | null;
  const epciId = useEpciId();
  const [value, setValue] = React.useState(data?.meta['commentaire'] ?? '');

  // There is probably something wrong with the state not being rebuilt
  // when props.meta changes.
  if (data && data.meta.commentaire && !value) setValue(data.meta.commentaire);

  function handleSave(
    event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const data: ActionMetaTypedInterface = {
      action_id: props.actionId,
      epci_id: epciId!,
      meta: {commentaire: event.currentTarget.value},
    };
    console.log(data);
    actionMetaStore.store(new ActionMetaStorable(data)).then(storable => {
      const data = storable as ActionMetaTypedInterface;
      setValue(data.meta.commentaire);
    });
  }

  return (
    <textarea
      defaultValue={value}
      onBlur={handleSave}
      className="fr-input mt-2 w-full bg-white p-3 border-b-2 border-gray-500 mr-5"
    />
  );
};
