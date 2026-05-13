import { appLabels } from '@/app/labels/catalog';
import { Modal } from '@tet/ui/design-system/ModalNext/index';
import { CreatePlanOptionLinksList } from './components/create-plan-option-link.list.tsx';

type CreatePlanModalProps = {
  collectiviteId: number;
  panierId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreatePlanModal({
  collectiviteId,
  panierId,
  open,
  onOpenChange,
}: CreatePlanModalProps) {
  return (
    <Modal openState={{ isOpen: open, setIsOpen: onOpenChange }} size="lg">
      <Modal.Header>
        <Modal.Title>{appLabels.creerPlan}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <CreatePlanOptionLinksList
          collectiviteId={collectiviteId}
          panierId={panierId}
        />
      </Modal.Body>
      <Modal.Footer>
        <Modal.Cancel size="xs">{appLabels.annuler}</Modal.Cancel>
      </Modal.Footer>
    </Modal>
  );
}
