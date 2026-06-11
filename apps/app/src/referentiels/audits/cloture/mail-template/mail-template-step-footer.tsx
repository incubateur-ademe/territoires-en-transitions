import { appLabels } from '@/app/labels/catalog';
import { Button, ModalFooter, ModalFooterSection } from '@tet/ui';
import { JSX } from 'react';

export const MailTemplateStepFooter = ({
  onCancel,
  onBack,
  onSubmit,
  canSubmit,
  isPending,
}: {
  onCancel: () => void;
  onBack: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
  isPending: boolean;
}): JSX.Element => (
  <ModalFooter variant="space">
    <Button
      type="button"
      variant="outlined"
      size="xs"
      icon="arrow-left-line"
      iconPosition="left"
      onClick={onBack}
      disabled={isPending}
    >
      {appLabels.revenirEtapePrecedente}
    </Button>
    <ModalFooterSection>
      <Button
        type="button"
        variant="outlined"
        size="xs"
        onClick={onCancel}
        disabled={isPending}
      >
        {appLabels.annuler}
      </Button>
      <Button type="button" size="xs" onClick={onSubmit} disabled={!canSubmit}>
        {appLabels.valider}
      </Button>
    </ModalFooterSection>
  </ModalFooter>
);
