import { appLabels } from '@/app/labels/catalog';
import { Button, ModalFooter, ModalFooterSection } from '@tet/ui';

type SwitchToTeConfirmationFooterProps = {
  onClose: () => void;
  onPrevious: () => void;
  canSubmit: boolean;
  onSubmit: () => void;
};

export const SwitchToTeConfirmationFooter = ({
  onClose,
  onPrevious,
  canSubmit,
  onSubmit,
}: SwitchToTeConfirmationFooterProps) => (
  <ModalFooter variant="space">
    <Button
      variant="outlined"
      size="xs"
      icon="arrow-left-line"
      iconPosition="left"
      onClick={onPrevious}
    >
      {appLabels.switchToTeConfirmPrevious}
    </Button>
    <ModalFooterSection>
      <Button variant="outlined" size="xs" onClick={onClose}>
        {appLabels.annuler}
      </Button>
      <Button
        size="xs"
        variant="danger"
        disabled={!canSubmit}
        onClick={onSubmit}
      >
        {appLabels.switchToTeConfirmSubmit}
      </Button>
    </ModalFooterSection>
  </ModalFooter>
);
