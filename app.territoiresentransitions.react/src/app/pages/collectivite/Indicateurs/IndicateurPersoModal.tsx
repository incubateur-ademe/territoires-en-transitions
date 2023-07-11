import Modal from 'ui/shared/floating-ui/Modal';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import IndicateurPersoNouveau from 'app/pages/collectivite/Indicateurs/IndicateurPersoNouveau';

/** Affiche le formulaire de création d'un indicateur personnalisé dans un
 * dialogue (pour ouverture depuis une fiche action) */
export const IndicateurPersonnaliseCreationDialog = () => {
  const currentCollectivite = useCurrentCollectivite();

  return currentCollectivite && !currentCollectivite.readonly ? (
    <Modal
      size="lg"
      render={({close}) => <IndicateurPersoNouveau onClose={close} />}
    >
      <button className="fr-btn fr-btn--tertiary fr-ml-4w">
        Créer un indicateur
      </button>
    </Modal>
  ) : null;
};
