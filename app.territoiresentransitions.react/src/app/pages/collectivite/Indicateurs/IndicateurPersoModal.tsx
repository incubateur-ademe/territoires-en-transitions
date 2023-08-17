import Modal from 'ui/shared/floating-ui/Modal';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import IndicateurPersoNouveau from 'app/pages/collectivite/Indicateurs/IndicateurPersoNouveau';

/** Affiche le formulaire de création d'un indicateur personnalisé dans un
 * dialogue (pour ouverture depuis une fiche action) */
export const IndicateurPersonnaliseCreationDialog = ({
  ficheId,
}: {
  /** Identifiant de la fiche action à laquelle rattacher le nouvel indicateur */
  ficheId: number | null;
}) => {
  const currentCollectivite = useCurrentCollectivite();

  return currentCollectivite && !currentCollectivite.readonly && ficheId ? (
    <Modal
      size="lg"
      render={({close}) => (
        <IndicateurPersoNouveau onClose={close} ficheId={ficheId} />
      )}
    >
      <button className="fr-btn fr-btn--tertiary fr-mb-4w">
        Créer un indicateur personnalisé
      </button>
    </Modal>
  ) : null;
};
