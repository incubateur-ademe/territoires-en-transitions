import { Modal } from '@tet/ui';
import { useState } from 'react';
import { Login } from './Login';
import { LoginProps, LoginView } from './type';

/**
 * Encapsule le panneau d'authentification dans une modale
 */
export const LoginModal = (props: LoginProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const { view, onCancel } = props;

  const onClose = () => {
    setIsOpen(false);
    onCancel();
  };

  return (
    <Modal
      dataTest="SignInPage"
      disableDismiss
      backdropBlur
      size={mdDialog.includes(view) ? 'md' : 'lg'}
      title={getTitle(view)}
      openState={{ isOpen, setIsOpen }}
      onClose={onClose}
      render={() => <Login {...props} onCancel={() => onClose()} />}
    />
  );
};

// la modale est en format "md" pour ces contenus
const mdDialog: LoginView[] = [
  'msg_init_mdp',
  'msg_lien_envoye',
  'verify',
  'reset_mdp',
];

// retourne le titre approprié de la modale en fonction de son contenu
const getTitle = (view: LoginView) => {
  if (view === 'etape1') return 'Se connecter';
  if (view === 'mdp_oublie') return 'Mot de passe oublié ?';
  if (view === 'reset_mdp') return 'Choisissez votre nouveau mot de passe';
};
