import { Modal } from '@/ui';
import { useState } from 'react';
import { RejoindreUneCollectivite } from './RejoindreUneCollectivite';
import { RejoindreUneCollectiviteProps } from './useRejoindreUneCollectivite';

/**
 * Encapsule le formulaire dans une modale
 */
export const RejoindreUneCollectiviteModal = (
  props: RejoindreUneCollectiviteProps
) => {
  const [isOpen, setIsOpen] = useState(true);

  const onClose = () => {
    setIsOpen(false);
    props.onCancel?.();
  };

  return (
    <Modal
      dataTest="dialog-AssocierCollectivite"
      disableDismiss
      backdropBlur
      size="lg"
      title="Rejoindre une collectivité"
      openState={{ isOpen, setIsOpen }}
      onClose={onClose}
      render={() => (
        <RejoindreUneCollectivite {...props} onCancel={() => onClose()} />
      )}
    />
  );
};
