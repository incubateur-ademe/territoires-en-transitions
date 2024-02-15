import {useState} from 'react';
import {Modal} from '@design-system/Modal';
import {LoginProps} from './type';
import {Login} from './Login';

/**
 * Encapsule le panneau d'authentification dans une modale
 */
export const LoginModal = (props: LoginProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const {view, onCancel} = props;
  const size =
    view === 'msg_init_mdp' || view === 'msg_lien_envoye' ? 'md' : 'lg';
  const onClose = () => {
    setIsOpen(false);
    onCancel();
  };
  return (
    <Modal
      dataTest="SignInPage"
      backdropBlur
      size={size}
      openState={{isOpen, setIsOpen}}
      onClose={onClose}
      render={() => <Login {...props} onCancel={() => onClose()} />}
    />
  );
};
