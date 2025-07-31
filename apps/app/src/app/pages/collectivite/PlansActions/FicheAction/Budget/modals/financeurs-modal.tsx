import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import { getFicheAllEditorCollectiviteIds } from '@/app/plans/fiches/share-fiche/share-fiche.utils';
import BaseUpdateFicheModal from '@/app/plans/fiches/update-fiche/base-update-fiche.modal';
import { FicheWithRelations, Financeur } from '@/domain/plans/fiches';
import { Alert, Divider, ModalFooterOKCancel } from '@/ui';
import { OpenState } from '@/ui/utils/types';
import { isEqual } from 'es-toolkit';
import { useState } from 'react';
import FinanceursInput from './FinanceursInput';

type FinanceursModalProps = {
  openState: OpenState;
  fiche: Pick<FicheWithRelations, 'financeurs'> & FicheShareProperties;
  updateFinanceurs: (financeurs: Financeur[] | null | undefined) => void;
};

const FinanceursModal = ({
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
            collectiviteIds={getFicheAllEditorCollectiviteIds(fiche)}
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
