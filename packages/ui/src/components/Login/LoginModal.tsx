import {useState} from 'react';
import {Modal} from '@design-system/Modal';
import {LoginProps} from './type';
import {Login} from './Login';

/**
 * Encapsule le panneau d'authentification dans une modale
 */
export const LoginModal = (props: LoginProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const {defaultView, onCancel} = props;
  const size =
    defaultView === 'msg_init_mdp' || defaultView === 'msg_lien_envoye'
      ? 'md'
      : 'lg';
  const onClose = () => {
    setIsOpen(false);
    onCancel();
  };
  return (
    <Modal
      backdropBlur
      size={size}
      openState={{isOpen, setIsOpen}}
      onClose={onClose}
      render={() => <Login {...props} onCancel={() => onClose()} />}
    />
  );
};
