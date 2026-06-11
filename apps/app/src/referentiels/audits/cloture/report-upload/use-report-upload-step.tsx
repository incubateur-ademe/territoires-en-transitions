import { JSX } from 'react';
import { AuditReportUploadState } from '../data/use-upload-audit-report';
import { AuditReportUploader } from './audit-report-uploader';
import { UploadReportStepFooter } from './upload-report-step-footer';

type ReportUploadStepArgs = {
  uploadState: AuditReportUploadState;
  onNext: () => void;
  onCancel: () => void;
};

export const useReportUploadStep = ({
  uploadState,
  onNext,
  onCancel,
}: ReportUploadStepArgs): { body: JSX.Element; footer: JSX.Element } => ({
  body: <AuditReportUploader {...uploadState} />,
  footer: (
    <UploadReportStepFooter
      onCancel={onCancel}
      onNext={onNext}
      canGoToNextStep={uploadState.canProceed}
    />
  ),
});
