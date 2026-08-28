'use client';

import { appLabels } from '@/app/labels/catalog';
import { DEMARCHE_PCAET_DELAI_AVIS_MOIS } from '@tet/domain/demarches';
import { Modal, ModalFooterOKCancel } from '@tet/ui';

type Props = {
  onConfirm: () => void;
  onClose: () => void;
};

/**
 * Confirmation de la transmission pour avis.
 *
 * La transmission est un point de non-retour : elle ferme le dossier
 * d'élaboration d'un coup et fige la photo du diagnostic. Le geste étant
 * irréversible pour la collectivité, l'écran dit ce qui se passe ensuite avant
 * de l'engager.
 */
export const TransmettrePourAvisModal = ({ onConfirm, onClose }: Props) => (
  <Modal
    size="md"
    openState={{
      isOpen: true,
      setIsOpen: (isOpen) => {
        if (!isOpen) onClose();
      },
    }}
    title={appLabels.demarcheTransmettreConfirmationTitre}
    dataTest="demarches.transmettre-confirmation-modal"
    render={() => (
      <div className="flex flex-col gap-4">
        <p className="m-0">
          {appLabels.demarcheTransmettreConfirmationProcessus({
            mois: DEMARCHE_PCAET_DELAI_AVIS_MOIS,
          })}
        </p>
        <p className="m-0">{appLabels.demarcheTransmettreConfirmationGel}</p>
        <p className="m-0">{appLabels.demarcheTransmettreConfirmationSuite}</p>
      </div>
    )}
    renderFooter={({ close }) => (
      <ModalFooterOKCancel
        btnCancelProps={{ onClick: close }}
        btnOKProps={{
          children: appLabels.demarcheAvanceValiderDepot,
          icon: 'arrow-right-line',
          iconPosition: 'right',
          onClick: () => {
            onConfirm();
            close();
          },
        }}
      />
    )}
  />
);
