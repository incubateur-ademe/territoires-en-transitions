import { FinanceurUpdate } from '@/domain/plans/fiches';
import { Alert, Divider, Modal, ModalFooterOKCancel } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { isEqual } from 'es-toolkit';
import { useState } from 'react';
import FinanceursInput from './FinanceursInput';

type FinanceursModalProps = {
  openState: OpenState;
  financeurs: FinanceurUpdate[] | null | undefined;
  updateFinanceurs: (financeurs: FinanceurUpdate[] | null | undefined) => void;
};

const FinanceursModal = ({
  openState,
  financeurs,
  updateFinanceurs,
}: FinanceursModalProps) => {
  const [editedFinanceurs, setEditedFinanceurs] = useState(financeurs);

  const handleSave = () => {
    if (!isEqual(financeurs, editedFinanceurs)) {
      updateFinanceurs(editedFinanceurs);
    }
  };

  return (
    <Modal
      openState={openState}
      title="Financeurs"
      size="lg"
      render={() => (
        <div>
          <Divider />
          <Alert
            state="warning"
            title="Ce champ historiquement en TTC est passé en HT, veillez à vérifier vos valeurs et à les modifier le cas échéant. N’hésitez pas à contacter le support si vous avez besoin d’aide pour faire les conversions."
            rounded
            withBorder
            className="mb-8"
          />
          <FinanceursInput
            financeurs={editedFinanceurs}
            onUpdate={setEditedFinanceurs}
          />
          <Divider className="-mb-6 mt-6" />
        </div>
      )}
      // Boutons pour valider / annuler les modifications
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close }}
          btnOKProps={{
            onClick: () => {
              handleSave();
              close();
            },
          }}
        />
      )}
    />
  );
};

export default FinanceursModal;
