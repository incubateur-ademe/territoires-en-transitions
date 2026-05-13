import { appLabels } from '@/app/labels/catalog';
import { getTextFormattedDate } from '@/app/utils/formatUtils';
import { FicheWithRelations } from '@tet/domain/plans';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { JSX } from 'react';

const By = ({ prenom, nom }: { prenom?: string; nom?: string }) => {
  if (!prenom && !nom) {
    return null;
  }
  return (
    <>
      par {prenom} {nom}
    </>
  );
};

const Date = ({ date }: { date: string }) => {
  return <>{getTextFormattedDate({ date })}</>;
};

export const ActivityLogModal = ({
  fiche,
  onClose,
}: {
  fiche: FicheWithRelations;
  onClose: () => void;
}): JSX.Element => {
  return (
    <Modal
      openState={{
        isOpen: true,
        setIsOpen: (open) => {
          if (!open) onClose();
        },
      }}
      size="lg"
    >
      <Modal.Header>
        <Modal.Title>{appLabels.journalActivite}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div>
          Créée le <Date date={fiche.createdAt} /> <By {...fiche.createdBy} />
        </div>
        <div>
          Dernière modification le <Date date={fiche.modifiedAt} />{' '}
          <By {...fiche.modifiedBy} />
        </div>
      </Modal.Body>
    </Modal>
  );
};
