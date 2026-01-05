import IndicateurPersoNouveau from '@/app/app/pages/collectivite/Indicateurs/IndicateurPersoNouveau';
import { FicheWithRelations } from '@tet/domain/plans';
import { Modal } from '@tet/ui';

type CreateIndicateurModalProps = {
  isOpen: boolean;
  setIsOpen: (opened: boolean) => void;
  fiche?: FicheWithRelations;
  isFavoriCollectivite?: boolean;
};

export const CreateIndicateurModal = ({
  isOpen,
  setIsOpen,
  fiche,
  isFavoriCollectivite,
}: CreateIndicateurModalProps) => {
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
