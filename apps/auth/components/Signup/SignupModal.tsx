import { Modal } from '@tet/ui';
import { useState } from 'react';
import { Signup } from './Signup';
import { SignupProps, SignupView } from './type';

/**
 * Encapsule le panneau de création de compte dans une modale
 */
export const SignupModal = (props: SignupProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const { view, onCancel } = props;

  const onClose = () => {
    setIsOpen(false);
    onCancel();
  };

  return (
    <Modal
      dataTest="SignUpPage"
      disableDismiss
      backdropBlur
      size={mdDialog.includes(view) ? 'md' : 'lg'}
      title={getTitle(view)}
      subTitle={getSubTitle(view)}
      openState={{ isOpen, setIsOpen }}
      onClose={onClose}
      noCloseButton={view === 'etape3'}
      render={() => <Signup {...props} onCancel={() => onClose()} />}
    />
  );
};

// la modale est en format "md" pour ces contenus
const mdDialog: SignupView[] = ['msg_lien_envoye'];

// retourne le titre approprié de la modale en fonction de son contenu
const getTitle = (view: SignupView) => {
  if (view === 'etape1') return 'Créer un compte';
  if (view === 'etape2') return 'Créer un compte';
  if (view === 'etape3')
    return 'Il nous manque quelques informations sur vous !';
};

const getSubTitle = (view: SignupView) => {
  if (view === 'etape1') return 'Étape 1/3';
  if (view === 'etape2') return 'Étape 2/3';
  if (view === 'etape3') return 'Étape 3/3';
};
