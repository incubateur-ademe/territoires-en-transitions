import Modal from 'ui/shared/floating-ui/Modal';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import IndicateurPersoNouveau from 'app/pages/collectivite/Indicateurs/IndicateurPersoNouveau';
import {FicheAction} from '../../data/types';
import {Button} from '@tet/ui';

/** Affiche le formulaire de création d'un indicateur personnalisé dans un
 * dialogue (pour ouverture depuis une fiche action) */
export const CreerIndicateurPersoModal = ({
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
      <Button variant="outlined">Créer un indicateur personnalisé</Button>
    </Modal>
  ) : null;
};
