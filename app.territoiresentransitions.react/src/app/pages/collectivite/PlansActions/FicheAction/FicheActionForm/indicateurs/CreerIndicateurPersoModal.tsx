import {Button, ButtonVariant, Modal} from '@tet/ui';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import IndicateurPersoNouveau from 'app/pages/collectivite/Indicateurs/Indicateur/IndicateurPersoNouveau';
import {FicheAction} from '../../data/types';

/** Affiche le formulaire de création d'un indicateur personnalisé dans un
 * dialogue (pour ouverture depuis une fiche action) */
export const CreerIndicateurPersoModal = ({
  fiche,
  buttonVariant = 'outlined',
}: {
  /** Fiche action à laquelle rattacher le nouvel indicateur */
  fiche?: FicheAction;
  /** Permet de changer l'apparence du bouton */
  buttonVariant?: ButtonVariant;
}) => {
  const currentCollectivite = useCurrentCollectivite();

  return currentCollectivite && !currentCollectivite.readonly ? (
    <Modal
      size="lg"
      render={({close}) => (
        <IndicateurPersoNouveau onClose={close} fiche={fiche} />
      )}
    >
      <Button variant={buttonVariant} size="sm">
        Créer un indicateur
      </Button>
    </Modal>
  ) : null;
};
