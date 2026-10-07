import { appLabels } from '@/app/labels/catalog';
import { Modal } from '@tet/ui';
import { useState } from 'react';
import { Signup } from './signup';
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
      size={mdDialog.includes(view) ? 'sm' : 'md'}
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
  if (view === 'etape1') return appLabels.authSignupTitre;
  if (view === 'etape2') return appLabels.authSignupTitre;
  if (view === 'etape3') return appLabels.authSignupTitreDerniereEtape;
};

// Plus de « Étape n/3 » : à l'étape 1 la méthode de connexion n'est pas encore
// choisie, le nombre d'écrans restants est donc inconnu.
const getSubTitle = (view: SignupView) => {
  if (view === 'etape2') return appLabels.authSignupSousTitreVerifiezEmail;
  if (view === 'etape3') return appLabels.authSignupSousTitreDerniereEtape;
};
