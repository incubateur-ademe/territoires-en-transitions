import { getFicheAllEditorCollectiviteIds } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import BaseUpdateFicheModal from '@/app/plans/fiches/update-fiche/base-update-fiche.modal';
import { FicheWithRelations, Financeur } from '@tet/domain/plans';
import { ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { isEqual } from 'es-toolkit';
import { useState } from 'react';
import { FinanceursInput } from './financeurs.input';

type FinanceursModalProps = {
  openState: OpenState;
  fiche: FicheWithRelations;
  updateFinanceurs: (financeurs: Financeur[] | null | undefined) => void;
};

export const FinanceursModal = ({
  openState,
  fiche,
  updateFinanceurs,
}: FinanceursModalProps) => {
  const financeurs = fiche.financeurs;
  const [editedFinanceurs, setEditedFinanceurs] = useState<
    Financeur[] | null | undefined
  >(financeurs);

  const handleSave = () => {
    if (!isEqual(financeurs, editedFinanceurs)) {
      updateFinanceurs(editedFinanceurs);
    }
  };

  return (
    <BaseUpdateFicheModal
      fiche={fiche}
      openState={openState}
      title="Financeurs"
      size="lg"
      render={() => (
        <FinanceursInput
          financeurs={editedFinanceurs}
          collectiviteIds={getFicheAllEditorCollectiviteIds(fiche)}
          onUpdate={setEditedFinanceurs}
        />
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
