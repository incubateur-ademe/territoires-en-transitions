import { Fiche } from '@/app/app/pages/collectivite/PlansActions/FicheAction/data/use-get-fiche';
import BaseUpdateFicheModal from '@/app/plans/fiches/update-fiche/base-update-fiche.modal';
import { Field, ModalFooterOKCancel, RichTextEditor } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { useState } from 'react';
import { FicheShareProperties } from '../../../share-fiche/fiche-share-properties.dto';

type FinancementsModalProps = {
  openState: OpenState;
  fiche: Pick<Fiche, 'financements'> & FicheShareProperties;
  updateFinancements: (financements: string | null | undefined) => void;
};

export const FinancementsModal = ({
  openState,
  fiche,
  updateFinancements,
}: FinancementsModalProps) => {
  const financements = fiche.financements;
  const [editedFinancements, setEditedFinancements] = useState(financements);

  const handleSave = () => {
    if (financements !== editedFinancements?.trim()) {
      updateFinancements(editedFinancements);
    }
  };

  return (
    <BaseUpdateFicheModal
      fiche={fiche}
      openState={openState}
      title="Financements"
      size="lg"
      render={() => (
        <Field hint="Coûts unitaires, fonctionnement, investissement, recettes attendues, subventions…">
          <RichTextEditor
            initialValue={editedFinancements ?? ''}
            onChange={(value) => {
              setEditedFinancements(value?.trim() ? value : null);
            }}
          />
        </Field>
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
