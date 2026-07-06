'use client';

import { Modal, ModalFooterOKCancel } from '@tet/ui';
import { JSX } from 'react';
import { appLabels } from '@/app/labels/catalog';

type ReferenceYearChangeModalProps = {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ReferenceYearChangeModal = ({
  isOpen,
  onConfirm,
  onCancel,
}: ReferenceYearChangeModalProps): JSX.Element => (
  <Modal
    size="xs"
    title={appLabels.indicateurChangerAnneeReferenceTitre}
    openState={{
      isOpen,
      setIsOpen: (open) => {
        if (!open) {
          onCancel();
        }
      },
    }}
    render={() => (
      <p className="mb-0 text-sm text-grey-8">
        {appLabels.indicateurChangerAnneeReferenceDescription}
      </p>
    )}
    renderFooter={({ close }) => (
      <ModalFooterOKCancel
        btnCancelProps={{ children: appLabels.annuler, onClick: close }}
        btnOKProps={{ children: appLabels.confirmer, onClick: onConfirm }}
      />
    )}
  />
);
