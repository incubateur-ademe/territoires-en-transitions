import {useEffect, useState} from 'react';
import {ActionStatusStorable} from 'storables/ActionStatusStorable';
import {actionStatusStore} from 'core-logic/api/hybridStores';

export const useActionStatus = (actionStorableId: string) => {
  const [actionStatus, setActionStatus] = useState<ActionStatusStorable | null>(
    null
  );

  useEffect(() => {
    const listener = async () => {
      const actionStatus = await actionStatusStore.retrieveById(
        actionStorableId
      );
      setActionStatus(actionStatus);
    };

    actionStatusStore.retrieveById(actionStorableId).then(storable => {
      if (actionStatus !== storable) setActionStatus(storable);
    });
    actionStatusStore.addListener(listener);
    return () => {
      actionStatusStore.removeListener(listener);
    };
  });

  return actionStatus;
};
