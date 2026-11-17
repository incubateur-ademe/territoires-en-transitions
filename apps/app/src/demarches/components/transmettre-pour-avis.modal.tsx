'use client';

import { appLabels } from '@/app/labels/catalog';
import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { useState } from 'react';

type Props = {
  /** Rend la promesse de la transition : la modale attend sa réponse. */
  onConfirm: () => Promise<unknown>;
  onClose: () => void;
};

/**
 * Confirmation de la transmission pour avis.
 *
 * La transmission est un point de non-retour : elle ferme le dossier
 * d'élaboration d'un coup et fige la photo du diagnostic. Le geste étant
 * irréversible pour la collectivité, l'écran dit ce qui se passe ensuite avant
 * de l'engager.
 *
 * La transition fige les classeurs du dossier et peut prendre quelques
 * secondes : la modale reste ouverte, bouton en chargement, jusqu'à la
 * réponse. En échec, elle reste ouverte pour réessayer (le message d'erreur
 * vient du toast global des mutations).
 */
export const TransmettrePourAvisModal = ({ onConfirm, onClose }: Props) => {
  const [isPending, setIsPending] = useState(false);

  return (
    <Modal
      size="md"
      openState={{
        isOpen: true,
        setIsOpen: (isOpen) => {
          if (!isOpen && !isPending) onClose();
        },
      }}
      title={appLabels.demarcheTransmettreConfirmationTitre}
      dataTest="demarches.transmettre-confirmation-modal"
      render={() => (
        <div className="flex flex-col gap-4">
          <p className="m-0">
            {appLabels.demarcheTransmettreConfirmationProcessus}
          </p>
          <p className="m-0">
            {appLabels.demarcheTransmettreConfirmationSuite}
          </p>
        </div>
      )}
      renderFooter={({ close }) => (
        <ModalFooterOKCancel
          btnCancelProps={{ onClick: close, disabled: isPending }}
          btnOKProps={{
            children: appLabels.demarcheAvanceValiderDepot,
            icon: 'arrow-right-line',
            iconPosition: 'right',
            loading: isPending,
            disabled: isPending,
            onClick: async () => {
              setIsPending(true);
              try {
                await onConfirm();
              } catch {
                setIsPending(false);
                return;
              }
              onClose();
            },
          }}
        />
      )}
    />
  );
};
