'use client';

import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { JSX } from 'react';
import { appLabels } from '@/app/labels/catalog';

type RemoveYearConfirmModalProps = {
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export const RemoveYearConfirmModal = ({
  isOpen,
  onConfirm,
  onClose,
}: RemoveYearConfirmModalProps): JSX.Element => (
  <Modal
    size="xs"
    title={appLabels.indicateurRetirerAnneeTitre}
    openState={{
      isOpen,
      setIsOpen: (open) => {
        if (!open) {
          onClose();
        }
      },
    }}
    render={() => (
      <p className="mb-0 text-sm text-grey-8">
        {appLabels.indicateurRetirerAnneeMessage}
      </p>
    )}
    renderFooter={({ close }) => (
      <ModalFooterOKCancel
        btnCancelProps={{ children: appLabels.annuler, onClick: close }}
        btnOKProps={{
          children: appLabels.indicateurRetirerAnneeConfirmer,
          onClick: onConfirm,
        }}
      />
    )}
  />
);
