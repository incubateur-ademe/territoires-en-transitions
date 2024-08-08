import {Button, Modal} from '@tet/ui';
import {useCurrentCollectivite} from 'core-logic/hooks/useCurrentCollectivite';
import IndicateurPersoNouveau from 'app/pages/collectivite/Indicateurs/Indicateur/IndicateurPersoNouveau';
import {FicheAction} from '../../data/types';

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
      <Button variant="outlined" size="sm">
        Créer un indicateur
      </Button>
    </Modal>
  ) : null;
};
