import {useState} from 'react';
import {Modal} from '@design-system/Modal';
import {SignupProps} from './type';
import {Signup} from './Signup';

/**
 * Encapsule le panneau de création de compte dans une modale
 */
export const SignupModal = (props: Omit<SignupProps, 'onCancel'>) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <Modal
      backdropBlur
      size="lg"
      openState={{isOpen, setIsOpen}}
      render={() => <Signup {...props} onCancel={() => setIsOpen(false)} />}
    />
  );
};
