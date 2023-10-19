import Modal from 'ui/shared/floating-ui/Modal';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import IndicateurPersoNouveau from 'app/pages/collectivite/Indicateurs/IndicateurPersoNouveau';
import {FicheAction} from '../PlansActions/FicheAction/data/types';

/** Affiche le formulaire de création d'un indicateur personnalisé dans un
 * dialogue (pour ouverture depuis une fiche action) */
export const IndicateurPersonnaliseCreationDialog = ({
  fiche,
}: {
  /** Fiche action à laquelle rattacher le nouvel indicateur */
  fiche: FicheAction;
}) => {
  const currentCollectivite = useCurrentCollectivite();
  const ficheId = fiche?.id;

  return currentCollectivite && !currentCollectivite.readonly && ficheId ? (
    <Modal
      size="lg"
      render={({close}) => (
        <IndicateurPersoNouveau onClose={close} fiche={fiche} />
      )}
    >
      <button className="fr-btn fr-btn--tertiary fr-mb-4w">
        Créer un indicateur personnalisé
      </button>
    </Modal>
  ) : null;
};
