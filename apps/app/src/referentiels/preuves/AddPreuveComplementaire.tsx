import { appLabels } from '@/app/labels/catalog';
import { TActionDef } from '@/app/referentiels/preuves/usePreuves';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { getReferentielIdFromActionId } from '@tet/domain/referentiels';
import { Button, Field, Modal, Select } from '@tet/ui';
import { useState } from 'react';
import { useGetActionChildren } from '../actions/use-get-action-children';
import { AddPreuveModal } from './AddPreuveModal';
import type { TOnDuplicatedDocumentsAdded } from './AddPreuveModal/types';
import { useAddPreuveComplementaireToAction } from './useAddPreuveToAction';

export type TAddPreuveButtonProps = {
  action: TActionDef;
  addToSubAction?: boolean;
  onDuplicatedDocumentsAdded?: TOnDuplicatedDocumentsAdded;
};

export const AddPreuveComplementaire = (props: TAddPreuveButtonProps) => {
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
          <AddPreuveModal
            docType="complementaire"
            onClose={onClose}
            handlers={handlers}
            onDuplicatedDocumentsAdded={onDuplicatedDocumentsAdded}
          />
        );
      }}
    >
      <Button
        dataTest="AddPreuveComplementaire"
        title={appLabels.ajouterDocumentComplementaire}
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
  action: TActionDef;
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
