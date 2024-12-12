import React from 'react';

import { Modal, ModalFooterOKCancel } from '@/ui';
import { OpenState } from '@/ui/utils/types';

import { useDeleteEtape } from './use-delete-etape';

type Props = {
  openState: OpenState;
  etapeId: number;
};

const ModalDeleteEtape = ({ openState, etapeId }: Props) => {
  const { mutate: deleteEtape } = useDeleteEtape();

  return (
    <Modal
      openState={openState}
      title="Supprimer l’étape"
      description="Cette étape sera supprimée définitivement de la fiche action. Souhaitez-vous vraiment supprimer cette étape ?"
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnOKProps={{
            children: 'Confirmer',
            onClick: () => {
              deleteEtape({ etapeId });
              close();
            },
          }}
          btnCancelProps={{
            onClick: () => close(),
          }}
        />
      )}
    />
  );
};

export default ModalDeleteEtape;
