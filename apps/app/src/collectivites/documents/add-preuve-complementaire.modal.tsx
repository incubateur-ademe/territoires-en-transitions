import { appLabels } from '@/app/labels/catalog';
import { ActionIdentity } from '@/app/referentiels/actions/use-list-actions';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';
import { Button, Field, Modal, Select } from '@tet/ui';
import { useState } from 'react';
import { useGetActionChildren } from '@/app/referentiels/actions/use-get-action-children';
import { AddDocumentTabs } from './add-document/add-document.tabs';
import type { OnDuplicatedDocumentsAdded } from './add-document/types';
import { useAddPreuveComplementaireToAction } from './use-add-preuve-to-action';

export type AddPreuveComplementaireModalProps = {
  action: ActionIdentity;
  addToSubAction?: boolean;
  onDuplicatedDocumentsAdded?: OnDuplicatedDocumentsAdded;
};

export const AddPreuveComplementaireModal = (
  props: AddPreuveComplementaireModalProps
) => {
  const [opened, setOpened] = useState(false);

  const { action, addToSubAction, onDuplicatedDocumentsAdded } = props;
  const [subaction_id, setSubaction] = useState('');
  const selectSubActionIsRequired = addToSubAction && !subaction_id;

  const handlers = useAddPreuveComplementaireToAction(
    addToSubAction ? subaction_id : action.actionId
  );

  const currentCollectivite = useCurrentCollectivite();
  const referentielId = getReferentielIdFromActionId(action.actionId);
  if (
    !currentCollectivite.hasReferentielPermission(
      'referentiels.mutate',
      referentielId
    )
  ) {
    return null;
  }

  const onClose = () => {
    setOpened(false);
    setSubaction('');
  };

  return (
    <Modal
      size="lg"
      openState={{ isOpen: opened, setIsOpen: setOpened }}
      disableDismiss={selectSubActionIsRequired}
      title={appLabels.ajouterDocumentComplementaire}
      render={() => {
        return selectSubActionIsRequired ? (
          <SelectSubAction action={action} setSubaction={setSubaction} />
        ) : (
          <AddDocumentTabs
            docType="complementaire"
            onClose={onClose}
            handlers={handlers}
            onDuplicatedDocumentsAdded={onDuplicatedDocumentsAdded}
          />
        );
      }}
    >
      <Button
        title={appLabels.ajouterDocumentComplementaire}
        aria-label={appLabels.ajouterDocumentComplementaire}
        size="xs"
        icon="file-add-fill"
        onClick={() => setOpened(true)}
        className="w-12 flex items-center justify-center"
      />
    </Modal>
  );
};

const SelectSubAction = ({
  action,
  setSubaction,
}: {
  action: ActionIdentity;
  setSubaction: (value: string) => void;
}) => {
  const children = useGetActionChildren({
    actionId: action.actionId,
  });

  const selectOptions = children.map(({ actionId, identifiant, nom }) => ({
    value: actionId,
    label: `${identifiant} ${nom}`,
  }));

  return (
    <Field title={appLabels.sousActionAssociee}>
      <Select
        dataTest="SelectSubAction"
        options={selectOptions}
        onChange={(value) => value && setSubaction(value as string)}
      />
    </Field>
  );
};
