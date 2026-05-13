import { appLabels } from '@/app/labels/catalog';
import { TActionDef } from '@/app/referentiels/preuves/usePreuves';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Button, Field, Select } from '@tet/ui';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { useState } from 'react';
import { useSubActionOptionsListe } from '../use-sub-action-definitions';
import { AddPreuveModal } from './AddPreuveModal';
import { useAddPreuveComplementaireToAction } from './useAddPreuveToAction';

export type TAddPreuveButtonProps = {
  action: TActionDef;
  addToSubAction?: boolean;
};

export const AddPreuveComplementaire = (props: TAddPreuveButtonProps) => {
  const [opened, setOpened] = useState(false);

  const { action, addToSubAction } = props;
  const [subactionId, setSubaction] = useState('');
  const selectSubActionIsRequired = addToSubAction && !subactionId;

  const handlers = useAddPreuveComplementaireToAction(
    addToSubAction ? subactionId : action.id
  );

  const currentCollectivite = useCurrentCollectivite();
  if (!currentCollectivite.hasCollectivitePermission('referentiels.mutate')) {
    return null;
  }

  const handleClose = () => {
    setOpened(false);
    setSubaction('');
  };

  return (
    <Modal
      size="lg"
      openState={{
        isOpen: opened,
        setIsOpen: (open) => (open ? setOpened(true) : handleClose()),
      }}
      dismissable={!selectSubActionIsRequired}
    >
      <Modal.Trigger>
        <Button
          dataTest="AddPreuveComplementaire"
          title={appLabels.ajouterDocumentComplementaire}
          size="xs"
          icon="file-add-fill"
          className="w-12 flex items-center justify-center"
        />
      </Modal.Trigger>
      <Modal.Header>
        <Modal.Title>{appLabels.ajouterDocumentComplementaire}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selectSubActionIsRequired ? (
          <SelectSubAction action={action} setSubaction={setSubaction} />
        ) : (
          <AddPreuveModal
            docType="complementaire"
            onClose={handleClose}
            handlers={handlers}
          />
        )}
      </Modal.Body>
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
  const options = useSubActionOptionsListe(action);

  return (
    <Field title={appLabels.sousActionAssociee}>
      <Select
        dataTest="SelectSubAction"
        options={options}
        onChange={(value) => value && setSubaction(value as string)}
      />
    </Field>
  );
};
