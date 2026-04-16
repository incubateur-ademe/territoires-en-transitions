import { appLabels } from '@/app/labels/catalog';
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
          ? appLabels.rendreFichesPriveesQuestion
          : appLabels.rendreFichesPubliquesQuestion
      }
      description={
        isPrivate
          ? appLabels.rendreFichesPriveesDescription
          : appLabels.rendreFichesPubliquesDescription
      }
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{
            onClick: () => close(),
          }}
          btnOKProps={{
            'aria-label': appLabels.confirmer,
            children: appLabels.confirmer,
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
