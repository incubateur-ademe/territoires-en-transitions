import IndicateurPersoNouveau from '@/app/app/pages/collectivite/Indicateurs/IndicateurPersoNouveau';
import { Modal } from '@tet/ui';
import { Fiche } from '../data/use-get-fiche';

type ModaleCreerIndicateurProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  fiche?: Fiche;
  isFavoriCollectivite?: boolean;
};

const ModaleCreerIndicateur = ({
  isOpen,
  setIsOpen,
  fiche,
  isFavoriCollectivite,
}: ModaleCreerIndicateurProps) => {
  return (
    <Modal
      openState={{ isOpen, setIsOpen }}
      title="Créer un indicateur personnalisé"
      size="lg"
      render={({ close }) => (
        <IndicateurPersoNouveau
          onClose={close}
          fiche={fiche}
          isFavoriCollectivite={isFavoriCollectivite}
        />
      )}
    />
  );
};

export default ModaleCreerIndicateur;
