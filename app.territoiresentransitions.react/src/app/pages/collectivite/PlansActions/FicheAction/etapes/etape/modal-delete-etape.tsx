import { ModalFooterOKCancel } from '@/ui';
import { OpenState } from '@/ui/utils/types';

import { FicheShareProperties } from '@/app/plans/fiches/share-fiche/fiche-share-properties.dto';
import BaseUpdateFicheModal from '@/app/plans/fiches/update-fiche/base-update-fiche.modal';
import { useEtapesDispatch } from '../etapes-context';
import { useDeleteEtape } from './use-delete-etape';

type Props = {
  openState: OpenState;
  etapeId: number;
  fiche: FicheShareProperties;
};

const ModalDeleteEtape = ({ openState, etapeId, fiche }: Props) => {
  const dispatchEtapes = useEtapesDispatch();
  const { mutate: deleteEtape } = useDeleteEtape();

  return (
    <BaseUpdateFicheModal
      openState={openState}
      fiche={fiche}
      title="Supprimer l’étape"
      description="Cette étape sera supprimée définitivement de la fiche action. Souhaitez-vous vraiment supprimer cette étape ?"
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnOKProps={{
            children: 'Confirmer',
            onClick: () => {
              deleteEtape({ etapeId });
              dispatchEtapes({
                type: 'delete',
                payload: { etapeId },
              });
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
