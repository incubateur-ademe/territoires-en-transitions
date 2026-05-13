import IndicateurPersoNouveau from '@/app/app/pages/collectivite/Indicateurs/IndicateurPersoNouveau';
import { appLabels } from '@/app/labels/catalog';
import { FicheWithRelations } from '@tet/domain/plans';
import { Modal } from '@tet/ui/design-system/ModalNext/index';

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
    <Modal openState={{ isOpen, setIsOpen }} size="lg">
      <Modal.Header>
        <Modal.Title>{appLabels.indicateurVideCreerPersonnalise}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <IndicateurPersoNouveau
          onClose={() => setIsOpen(false)}
          fiche={fiche}
          isFavoriCollectivite={isFavoriCollectivite}
        />
      </Modal.Body>
    </Modal>
  );
};
