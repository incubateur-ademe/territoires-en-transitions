import {useState} from 'react';
import {Modal} from '@design-system/Modal';
import {LoginProps} from './type';
import {Login} from './Login';

/**
 * Encapsule le panneau d'authentification dans une modale
 */
export const LoginModal = (props: Omit<LoginProps, 'onCancel'>) => {
  const [isOpen, setIsOpen] = useState(true);
  const {defaultView} = props;
  const size =
    defaultView === 'msg_init_mdp' || defaultView === 'msg_lien_envoye'
      ? 'md'
      : 'lg';
  return (
    <Modal
      size={size}
      openState={{isOpen, setIsOpen}}
      render={() => <Login {...props} onCancel={() => setIsOpen(false)} />}
    />
  );
};
