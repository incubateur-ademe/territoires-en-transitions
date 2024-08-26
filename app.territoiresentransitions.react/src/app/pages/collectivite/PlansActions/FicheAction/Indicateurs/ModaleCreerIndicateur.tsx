import {Modal} from '@tet/ui';
import {FicheAction} from '../data/types';
import IndicateurPersoNouveau from 'app/pages/collectivite/Indicateurs/IndicateurPersoNouveau';

type ModaleCreerIndicateurProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  fiche?: FicheAction;
};

const ModaleCreerIndicateur = ({
  isOpen,
  setIsOpen,
  fiche,
}: ModaleCreerIndicateurProps) => {
  return (
    <Modal
      openState={{isOpen, setIsOpen}}
      title="Créer un indicateur personnalisé"
      size="lg"
      render={({close}) => (
        <IndicateurPersoNouveau onClose={close} fiche={fiche} />
      )}
    />
  );
};

export default ModaleCreerIndicateur;
