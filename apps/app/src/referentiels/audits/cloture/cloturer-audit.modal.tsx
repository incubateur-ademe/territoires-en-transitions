import { appLabels } from '@/app/labels/catalog';
import { Modal } from '@tet/ui';
import { JSX, useState } from 'react';
import { useUploadRapportAudit } from './data/use-upload-rapport-audit';
import { useMailStep } from './mail-template/use-mail-step';
import { useUploadRapportStep } from './rapport-audit/use-upload-rapport-step';

const STEPS = ['depot-rapport', 'mail-template'] as const;

type WizardStep = (typeof STEPS)[number];

export const CloturerAuditModal = ({
  auditId,
  demandeId,
  isOpen,
  setIsOpen,
}: {
  auditId: number;
  demandeId: number | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}): JSX.Element => {
  const [step, setStep] = useState<WizardStep>('depot-rapport');
  const [engagementChecked, setEngagementChecked] = useState(false);
  const uploadState = useUploadRapportAudit(auditId);

  const closeAndReset = (): void => {
    uploadState.abortUpload();
    setIsOpen(false);
    setStep('depot-rapport');
    setEngagementChecked(false);
  };

  const uploadRapportStep = useUploadRapportStep({
    uploadState,
    onNext: () => setStep('mail-template'),
    onCancel: closeAndReset,
  });
  const mailStep = useMailStep({
    auditId,
    demandeId,
    isUploading: uploadState.isUploading,
    engagementChecked,
    onEngagementCheckedChange: setEngagementChecked,
    onBack: () => setStep('depot-rapport'),
    onCancel: closeAndReset,
    onCompleted: closeAndReset,
  });

  const { body, footer } =
    step === 'depot-rapport' ? uploadRapportStep : mailStep;

  const stepNumber = STEPS.indexOf(step) + 1;
  const totalSteps = STEPS.length;

  return (
    <Modal
      openState={{ isOpen, setIsOpen }}
      title={appLabels.cloturerAudit}
      subTitle={appLabels.clotureAuditEtape({
        current: stepNumber,
        total: totalSteps,
      })}
      size="lg"
      disableDismiss
      onClose={closeAndReset}
      renderFooter={() => footer}
      render={() => body}
    />
  );
};
