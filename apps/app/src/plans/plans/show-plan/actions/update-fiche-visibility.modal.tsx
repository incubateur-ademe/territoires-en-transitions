import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { OpenState } from '@tet/ui/utils/types';
import { JSX } from 'react';
import { useSetFichesPrivate } from './use-set-fiches-private';

type Props = {
  children?: JSX.Element;
  planId: number;
  isPrivate: boolean;
  openState?: OpenState;
};

/**
 * Modale pour modifier la confidentialité des actions d'un plan.
 */
const RestreindreFichesModal = ({
  children,
  planId,
  isPrivate,
  openState,
}: Props) => {
  const { mutate: setFichesPrivate } = useSetFichesPrivate();
  return (
    <Modal
      openState={openState}
      textAlign="left"
      title={
        isPrivate
          ? 'Souhaitez-vous rendre privées toutes les actions de ce plan ?'
          : 'Souhaitez-vous rendre publiques toutes les actions de ce plan ?'
      }
      description={
        isPrivate
          ? "En passant en privé l'ensemble des actions de ce plan, elles ne seront plus accessibles par les personnes n’étant pas membres de votre collectivité. Les actions restent consultables par l’ADEME et le service support de la plateforme."
          : "En passant en public l'ensemble des actions de ce plan, elles seront accessibles à toutes les personnes n’étant pas membres de votre collectivité."
      }
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{
            onClick: () => close(),
          }}
          btnOKProps={{
            'aria-label': 'Confirmer',
            children: 'Confirmer',
            onClick: () => {
              setFichesPrivate({ planId, isPrivate });
              close();
            },
          }}
        />
      )}
    >
      {children}
    </Modal>
  );
};

export default RestreindreFichesModal;
