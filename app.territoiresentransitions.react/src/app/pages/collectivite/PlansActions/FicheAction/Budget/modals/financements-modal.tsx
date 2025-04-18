import { Divider, Field, Modal, ModalFooterOKCancel, Textarea } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { useState } from 'react';

type FinancementsModalProps = {
  openState: OpenState;
  financements: string | null | undefined;
  updateFinancements: (financements: string | null | undefined) => void;
};

const FinancementsModal = ({
  openState,
  financements,
  updateFinancements,
}: FinancementsModalProps) => {
  const [editedFinancements, setEditedFinancements] = useState(financements);

  const handleSave = () => {
    if (financements !== editedFinancements?.trim()) {
      updateFinancements(editedFinancements);
    }
  };

  return (
    <Modal
      openState={openState}
      title="Financements"
      size="lg"
      render={() => (
        <div>
          <Divider />
          <Field
            title="Financements"
            hint="Coûts unitaires, fonctionnement, investissement, recettes attendues, subventions…"
          >
            <Textarea
              className="min-h-[120px]"
              value={editedFinancements ?? ''}
              onChange={(evt) => {
                const value = (evt.target as HTMLTextAreaElement).value;
                if (value.trim() !== '') setEditedFinancements(value);
                else setEditedFinancements(null);
              }}
            />
          </Field>
        </div>
      )}
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

export default FinancementsModal;
