import { appLabels } from '@/app/labels/catalog';
import { Modal } from '@tet/ui';
import { JSX, useState } from 'react';
import { useUploadAuditReport } from './data/use-upload-audit-report';
import { useMailStep } from './mail-template/use-mail-step';
import { useReportUploadStep } from './report-upload/use-report-upload-step';

const STEPS = ['report-upload', 'mail-template'] as const;

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
  const [step, setStep] = useState<WizardStep>('report-upload');
  const [engagementChecked, setEngagementChecked] = useState(false);
  const uploadState = useUploadAuditReport(auditId);

  const closeAndReset = (): void => {
    uploadState.abortUpload();
    setIsOpen(false);
    setStep('report-upload');
    setEngagementChecked(false);
  };

  const reportUploadStep = useReportUploadStep({
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
    onBack: () => setStep('report-upload'),
    onCancel: closeAndReset,
    onCompleted: closeAndReset,
  });

  const { body, footer } =
    step === 'report-upload' ? reportUploadStep : mailStep;

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
