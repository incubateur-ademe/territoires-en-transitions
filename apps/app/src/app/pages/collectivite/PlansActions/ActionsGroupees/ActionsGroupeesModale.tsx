import { appLabels } from '@/app/labels/catalog';
import { FormSectionGrid } from '@tet/ui';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { JSX } from 'react';

type ActionsGroupeesModaleProps = {
  children: JSX.Element;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onSave: () => void;
};

const ActionsGroupeesModale = ({
  children,
  isOpen,
  onOpenChange,
  title,
  onSave,
}: ActionsGroupeesModaleProps) => {
  return (
    <Modal openState={{ isOpen: isOpen, setIsOpen: onOpenChange }}>
      <Modal.Header>
        <Modal.Title>{title}</Modal.Title>
        <Modal.Subtitle>{appLabels.editionGroupeeSousTitre}</Modal.Subtitle>
      </Modal.Header>
      <Modal.Body>
        <FormSectionGrid>{children}</FormSectionGrid>
      </Modal.Body>
      <Modal.Footer>
        <Modal.Cancel>{appLabels.annuler}</Modal.Cancel>
        <Modal.Ok
          onClick={() => {
            onSave();
            onOpenChange(false);
          }}
        >
          {appLabels.valider}
        </Modal.Ok>
      </Modal.Footer>
    </Modal>
  );
};

export default ActionsGroupeesModale;
