import {useState} from 'react';
import {Modal} from '@design-system/Modal';
import {SignupProps} from './type';
import {Signup} from './Signup';

/**
 * Encapsule le panneau de création de compte dans une modale
 */
export const SignupModal = (props: SignupProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const onClose = () => {
    setIsOpen(false);
    props.onCancel();
  };

  return (
    <Modal
      backdropBlur
      size="lg"
      openState={{isOpen, setIsOpen}}
      onClose={onClose}
      render={() => <Signup {...props} onCancel={() => onClose()} />}
    />
  );
};
