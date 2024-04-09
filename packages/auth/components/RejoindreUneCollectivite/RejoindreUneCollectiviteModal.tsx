import {useState} from 'react';
import {Modal} from '@tet/ui';
import {RejoindreUneCollectiviteProps} from './type';
import {RejoindreUneCollectivite} from './RejoindreUneCollectivite';

/**
 * Encapsule le formulaire dans une modale
 */
export const RejoindreUneCollectiviteModal = (
  props: RejoindreUneCollectiviteProps,
) => {
  const [isOpen, setIsOpen] = useState(true);

  const onClose = () => {
    setIsOpen(false);
    props.onCancel?.();
  };

  return (
    <Modal
      dataTest="dialog-AssocierCollectivite"
      backdropBlur
      size="lg"
      title="Rejoindre une collectivité"
      openState={{isOpen, setIsOpen}}
      onClose={onClose}
      render={() => (
        <RejoindreUneCollectivite {...props} onCancel={() => onClose()} />
      )}
    />
  );
};
